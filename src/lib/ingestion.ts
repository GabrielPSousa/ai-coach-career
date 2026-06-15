import fs from "fs";
import path from "path";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { supabaseAdmin } from "./supabase";

interface IngestionResult {
  success: boolean;
  processedDocuments: number;
  totalChunks: number;
  errors: string[];
}

/**
 * Caminho absoluto para a pasta de conhecimento
 */
const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");

/**
 * Lê recursivamente todos os arquivos markdown em um diretório
 */
function getMarkdownFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getMarkdownFiles(filePath, fileList);
    } else if (path.extname(file) === ".md") {
      fileList.push(filePath);
    }
  }
  return fileList;
}

/**
 * Divide o conteúdo do markdown em seções baseadas em cabeçalhos (##)
 */
function chunkMarkdown(content: string, documentTitle: string): string[] {
  // Encontrar todas as seções iniciadas com ##
  const sections = content.split(/(?=^##\s)/m);
  const chunks: string[] = [];

  // O primeiro elemento pode ser o título principal do documento ou introdução antes do primeiro ##
  const intro = sections[0].trim();
  if (intro) {
    // Se a intro for só o título principal, podemos pular ou juntar com a próxima seção
    chunks.push(`Documento: ${documentTitle}\n\n${intro}`);
  }

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i].trim();
    if (section) {
      // Adiciona o título do documento como contexto ao topo de cada chunk para melhorar o RAG
      chunks.push(`Documento: ${documentTitle}\n\n${section}`);
    }
  }

  // Se nenhum chunk foi gerado (arquivo sem seções ##), adiciona o arquivo inteiro como um único chunk
  if (chunks.length === 0 && content.trim()) {
    chunks.push(`Documento: ${documentTitle}\n\n${content.trim()}`);
  }

  return chunks;
}

/**
 * Extrai o título principal (# Título) do markdown
 */
function extractTitle(content: string, defaultTitle: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : defaultTitle;
}

/**
 * Serviço principal de ingestão de conhecimento
 */
export async function ingestKnowledge(): Promise<IngestionResult> {
  const result: IngestionResult = {
    success: false,
    processedDocuments: 0,
    totalChunks: 0,
    errors: [],
  };

  try {
    const files = getMarkdownFiles(KNOWLEDGE_DIR);
    if (files.length === 0) {
      result.errors.push(
        "Nenhum arquivo markdown encontrado na pasta knowledge/",
      );
      return result;
    }

    // Verificar conexão com Supabase
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      result.errors.push("Variáveis de ambiente do Supabase estão ausentes.");
      return result;
    }

    for (const filePath of files) {
      try {
        const relativePath = path
          .relative(KNOWLEDGE_DIR, filePath)
          .replace(/\\/g, "/");
        const content = fs.readFileSync(filePath, "utf-8");
        const fileName = path.basename(filePath, ".md");
        const title = extractTitle(content, fileName);

        // 1. Inserir ou atualizar na tabela de documentos
        // Primeiro verificamos se o documento já existe
        const { data: existingDoc, error: checkError } = await supabaseAdmin
          .from("knowledge_documents")
          .select("id")
          .eq("source", relativePath)
          .maybeSingle();

        if (checkError) {
          result.errors.push(
            `Erro ao verificar documento ${relativePath}: ${checkError.message}`,
          );
          continue;
        }

        let docId: string;

        if (existingDoc) {
          docId = existingDoc.id;
          // Atualiza conteúdo
          const { error: updateError } = await supabaseAdmin
            .from("knowledge_documents")
            .update({ title, content })
            .eq("id", docId);

          if (updateError) {
            result.errors.push(
              `Erro ao atualizar documento ${relativePath}: ${updateError.message}`,
            );
            continue;
          }

          // Limpa chunks antigos para garantir idempotência
          const { error: deleteError } = await supabaseAdmin
            .from("knowledge_chunks")
            .delete()
            .eq("document_id", docId);

          if (deleteError) {
            result.errors.push(
              `Erro ao remover chunks antigos de ${relativePath}: ${deleteError.message}`,
            );
            continue;
          }
        } else {
          // Cria novo documento
          const { data: newDoc, error: insertError } = await supabaseAdmin
            .from("knowledge_documents")
            .insert({ title, source: relativePath, content })
            .select("id")
            .single();

          if (insertError) {
            result.errors.push(
              `Erro ao inserir documento ${relativePath}: ${insertError.message}`,
            );
            continue;
          }
          docId = newDoc.id;
        }

        // 2. Criar chunks de texto
        const chunks = chunkMarkdown(content, title);
        if (chunks.length === 0) continue;

        // 3. Gerar embeddings em lote usando Vercel AI SDK (embedMany)
        // Usamos o modelo text-embedding-3-small (1536 dimensões) ou gemini-embedding-2 (3072 dimensões ajustadas para 1536)
        const { embeddings } = await embedMany({
          model:
            process.env.EMBEDDING_MODEL_PROVIDER === "google"
              ? google.embedding("gemini-embedding-2")
              : openai.embedding("text-embedding-3-small"),
          values: chunks,
        });

        const finalEmbeddings = embeddings.map(embedding => {
          if (embedding.length === 1536) {
            return embedding;
          }
          if (embedding.length < 1536) {
            return [...embedding, ...new Array(1536 - embedding.length).fill(0)];
          }
          return embedding.slice(0, 1536);
        });

        // 4. Salvar os chunks com os embeddings gerados no Supabase
        const chunksToInsert = chunks.map((chunkText, index) => ({
          document_id: docId,
          content: chunkText,
          embedding: finalEmbeddings[index], // O pgvector aceita array numérico diretamente
        }));

        const { error: chunksInsertError } = await supabaseAdmin
          .from("knowledge_chunks")
          .insert(chunksToInsert);

        if (chunksInsertError) {
          result.errors.push(
            `Erro ao salvar chunks do documento ${relativePath}: ${chunksInsertError.message}`,
          );
        } else {
          result.processedDocuments++;
          result.totalChunks += chunks.length;
        }
      } catch (fileErr) {
        const fileErrorMessage =
          fileErr instanceof Error
            ? fileErr.message
            : "Erro desconhecido no arquivo";
        result.errors.push(
          `Erro ao processar arquivo ${filePath}: ${fileErrorMessage}`,
        );
      }
    }

    result.success = result.errors.length === 0;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Erro geral desconhecido";
    result.errors.push(`Erro geral de ingestão: ${errorMessage}`);
  }

  return result;
}
