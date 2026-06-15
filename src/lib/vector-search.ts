import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { supabaseAdmin } from "./supabase";

export interface SearchResult {
  id: string;
  document_id: string;
  content: string;
  document_title: string;
  similarity: number;
}

/**
 * Realiza uma busca vetorial na base de conhecimento utilizando pgvector no Supabase
 * @param query Texto da busca (ex: "Como funciona os hooks e o useEffect no React?")
 * @param limit Número máximo de chunks a retornar
 * @param threshold Limiar de similaridade cosseno mínimo (0.0 a 1.0)
 */
export async function searchKnowledge(
  query: string,
  limit = 4,
  threshold = 0.3,
): Promise<SearchResult[]> {
  try {
    if (!query || query.trim() === "") {
      return [];
    }

    // 1. Gerar o embedding vetorial da query do usuário
    const { embedding } = await embed({
      model:
        process.env.EMBEDDING_MODEL_PROVIDER === "google"
          ? google.embedding("gemini-embedding-2")
          : openai.embedding("text-embedding-3-small"),
      value: query,
    });

    // Ajustar a dimensão do embedding para exatamente 1536 se necessário (ex: Google retorna 768)
    let finalEmbedding = embedding;
    if (finalEmbedding.length < 1536) {
      finalEmbedding = [...finalEmbedding, ...new Array(1536 - finalEmbedding.length).fill(0)];
    } else if (finalEmbedding.length > 1536) {
      finalEmbedding = finalEmbedding.slice(0, 1536);
    }

    // 2. Executar a função RPC personalizada match_knowledge_chunks no Supabase
    const { data, error } = await supabaseAdmin.rpc("match_knowledge_chunks", {
      query_embedding: finalEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error("Erro na busca vetorial no Supabase:", error);
      return [];
    }

    return (data as SearchResult[]) || [];
  } catch (error) {
    console.error("Falha geral na busca vetorial:", error);
    return [];
  }
}
