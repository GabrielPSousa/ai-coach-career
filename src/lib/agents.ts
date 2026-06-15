import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { searchKnowledge, SearchResult } from "./vector-search";

// ==========================================
// Agent 1: Resume Analyzer
// ==========================================

export const ResumeAnalysisSchema = z.object({
  seniority: z
    .string()
    .describe(
      "Classificação de senioridade: Junior, Pleno, Senior ou Especialista",
    ),
  skills: z
    .array(z.string())
    .describe(
      "Lista de habilidades técnicas e soft skills encontradas no currículo",
    ),
  strengths: z
    .array(z.string())
    .describe(
      "Pontos fortes do perfil do candidato identificados no currículo",
    ),
  weaknesses: z
    .array(z.string())
    .describe(
      "Gaps técnicos ou pontos a serem desenvolvidos identificados no currículo",
    ),
});

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;

/**
 * Agente 1 - Analisador de Currículo
 * Analisa o texto bruto de um currículo e extrai informações estruturadas de forma inteligente.
 */
export async function analyzeResume(
  resumeText: string,
): Promise<ResumeAnalysis> {
  const { object } = await generateObject({
    model:
      process.env.CHAT_MODEL_PROVIDER === "google"
        ? google("gemini-2.5-flash")
        : openai("gpt-4o"),
    schema: ResumeAnalysisSchema,
    system: `Você é o Agent 1 - Resume Analyzer, um recrutador técnico e especialista em carreiras de tecnologia extremamente criterioso.
Seu papel é ler o currículo fornecido, analisar profundamente a experiência e responder em formato estritamente estruturado.
Identifique de forma realista a senioridade (Junior, Pleno, Senior ou Especialista), liste as tecnologias que o candidato realmente domina ou tem experiência prática, determine seus pontos fortes e mapeie seus gaps técnicos (weaknesses) com base nas exigências atuais do mercado de desenvolvimento de software.`,
    prompt: `Aqui está o currículo do candidato para análise:\n\n${resumeText}`,
  });

  return object;
}

// ==========================================
// Agent 2: Job Matcher
// ==========================================

export const JobMatchSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Score de aderência do candidato à vaga de 0 a 100"),
  matchingSkills: z
    .array(z.string())
    .describe(
      "Skills obrigatórias ou desejáveis presentes no currículo e exigidas na vaga",
    ),
  missingSkills: z
    .array(z.string())
    .describe(
      "Skills importantes exigidas na vaga mas ausentes ou pouco evidentes no currículo",
    ),
  recommendations: z
    .array(z.string())
    .describe(
      "Dicas práticas e acionáveis para o candidato se adequar melhor a essa vaga específica",
    ),
});

export type JobMatch = z.infer<typeof JobMatchSchema>;

/**
 * Agente 2 - Job Matcher
 * Compara o currículo com uma descrição de vaga e calcula a aderência e lacunas técnicas.
 */
export async function matchJob(
  resumeText: string,
  jobDescription: string,
): Promise<JobMatch> {
  const { object } = await generateObject({
    model:
      process.env.CHAT_MODEL_PROVIDER === "google"
        ? google("gemini-2.5-flash")
        : openai("gpt-4o"),
    schema: JobMatchSchema,
    system: `Você é o Agent 2 - Job Matcher, um Headhunter de tecnologia de elite especialista em avaliar fit técnico de candidatos para vagas de software.
Sua tarefa é comparar detalhadamente as experiências e habilidades listadas no currículo com os requisitos da vaga fornecida (skills obrigatórias e desejáveis).
Calcule um score de aderência realista (0-100%). Se houver lacunas gritantes de tecnologias essenciais, reduza o score proporcionalmente.
Identifique quais tecnologias/metodologias coincidem, quais estão faltando no currículo, e dê recomendações cirúrgicas de como o candidato pode otimizar seu perfil ou o que ele precisa estudar para ser aprovado.`,
    prompt: `
CANDIDATO (CURRÍCULO):
${resumeText}

VAGA (DESCRIÇÃO E REQUISITOS):
${jobDescription}
`,
  });

  return object;
}

// ==========================================
// Agent 3: Learning Planner (RAG-infused)
// ==========================================

export const LearningPlanSchema = z.object({
  weeks: z
    .array(
      z.object({
        weekNumber: z.number().describe("Número da semana, ex: 1, 2, 3"),
        topic: z.string().describe("Tópico principal de estudo da semana"),
        objective: z
          .string()
          .describe(
            "O objetivo de aprendizado que deve ser alcançado ao fim da semana",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "Lista de tarefas práticas, tópicos específicos a ler e exercícios para fazer",
          ),
        resources: z
          .array(z.string())
          .describe(
            "Conteúdos, links, referências conceituais baseadas no RAG ou boas práticas",
          ),
      }),
    )
    .describe("Plano de estudos organizado semana a semana"),
  additionalAdvice: z
    .string()
    .describe(
      "Conselho geral para o candidato acelerar seu aprendizado e se destacar no processo seletivo",
    ),
});

export type LearningPlan = z.infer<typeof LearningPlanSchema>;

/**
 * Agente 3 - Learning Planner (RAG)
 * Cria um cronograma de estudos personalizado baseado nas habilidades ausentes do candidato,
 * utilizando informações extraídas de forma vetorial de nossa base de conhecimento.
 */
export async function generateLearningPlan(
  missingSkills: string[],
  resumeSummary?: string,
): Promise<LearningPlan> {
  // 1. RAG: Buscar conteúdos altamente relevantes no Supabase para as habilidades ausentes
  let retrievedContext = "";
  const searchQueries = missingSkills.slice(0, 3); // Focar nas top 3 skills ausentes para evitar ruído
  const allResults: SearchResult[] = [];

  // Buscar em paralelo para cada uma das principais skills ausentes
  await Promise.all(
    searchQueries.map(async (skill) => {
      const results = await searchKnowledge(skill, 2, 0.25);
      allResults.push(...results);
    }),
  );

  // Remover duplicados por ID de chunk
  const uniqueResults = Array.from(
    new Map(allResults.map((item) => [item.id, item])).values(),
  );

  if (uniqueResults.length > 0) {
    retrievedContext = uniqueResults
      .map(
        (r, i) =>
          `--- DOCUMENTO DE APOIO ${i + 1}: ${r.document_title} (Fonte: ${r.document_id}) ---\n${r.content}`,
      )
      .join("\n\n");
  } else {
    retrievedContext =
      "Nenhum documento específico encontrado na base de conhecimento local. Use o conhecimento geral para gerar o plano.";
  }

  // 2. Chamar o LLM com o contexto do RAG para gerar o plano estruturado
  const { object } = await generateObject({
    model:
      process.env.CHAT_MODEL_PROVIDER === "google"
        ? google("gemini-2.5-flash")
        : openai("gpt-4o"),
    schema: LearningPlanSchema,
    system: `Você é o Agent 3 - Learning Planner, um educador técnico brilhante e arquiteto de software especializado em criar planos de estudo focados, práticos e rápidos para desenvolvedores de software acelerarem suas carreiras.
Seu objetivo é criar um plano de estudos semana a semana cobrindo as habilidades que o candidato não possui (missingSkills).
Você DEVE utilizar e referenciar ativamente os Documentos de Apoio fornecidos no contexto RAG (que vêm da nossa base de conhecimento interna sobre React, Node, AWS, PostgreSQL, System Design e Behavioral).
Personalize o plano conectando as necessidades do candidato com os conceitos específicos descritos nos documentos (como por exemplo, se o gap for PostgreSQL, use conceitos de Indexação descritos nos documentos de apoio; se for React, fale sobre useMemo, useCallback e rendering patterns explicados nos documentos).`,
    prompt: `
HABILIDADES AUSENTES (GAPS TÉCNICOS):
${JSON.stringify(missingSkills)}

SUMÁRIO DO PERFIL DO CANDIDATO (Opcional):
${resumeSummary || "Desenvolvedor buscando recolocação/aprimoramento técnico"}

DOCUMENTOS DE CONHECIMENTO RECUPERADOS (RAG CONTEXT):
${retrievedContext}
`,
  });

  return object;
}

// ==========================================
// Agent 4: Interview Simulator (RAG-infused System Prompt)
// ==========================================

/**
 * Agente 4 - Interview Simulator Prompt Generator
 * Cria o prompt de sistema especializado para conduzir a simulação de entrevista interativa.
 * Retorna o prompt de sistema que será fornecido ao modelo de chat.
 */
export async function getInterviewSimulatorPrompt(
  category: string,
  seniority: string,
): Promise<string> {
  // 1. RAG: Buscar conhecimento relevante para a categoria da entrevista
  const searchResults = await searchKnowledge(category, 3, 0.25);
  let retrievedContext = "";

  if (searchResults.length > 0) {
    retrievedContext = searchResults
      .map(
        (r, i) =>
          `CONHECIMENTO DE REFERÊNCIA ${i + 1}: [${r.document_title}]\n${r.content}`,
      )
      .join("\n\n");
  }

  // 2. Retornar o prompt do sistema robusto
  return `Você é o Agent 4 - Interview Simulator, um Tech Lead altamente experiente e entrevistador técnico sênior da empresa.
Seu objetivo é conduzir uma entrevista técnica realista, desafiadora e construtiva na categoria "${category}" para um nível de senioridade "${seniority}".

INSTRUÇÕES DE COMPORTAMENTO:
1. **Postura**: Seja profissional, exigente porém acolhedor. Comporte-se de fato como um entrevistador humano em uma chamada ao vivo.
2. **Dinâmica**: 
   - Faça **uma pergunta técnica de cada vez**. Nunca faça uma lista de perguntas em uma única mensagem.
   - Espere o candidato responder antes de prosseguir.
   - Após a resposta do candidato, dê um feedback muito breve (ex: elogie o que estava certo, aponte sutilmente o que faltou de forma técnica) e emende a próxima pergunta relevante.
   - Conduza um total de **3 perguntas técnicas** ao longo da conversa.
   - Na 4ª rodada, finalize a entrevista, agradeça e apresente um **Relatório Final da Simulação** contendo:
     * **Nota Geral (0-100)**
     * **Pontos Fortes da Resposta**
     * **Onde o candidato escorregou ou pode aprofundar**
     * **Recomendação de Estudo baseada na nossa base de conhecimento**
3. **Uso da Base de Conhecimento (RAG)**:
   Abaixo está a base de conhecimento oficial da empresa para esta categoria. Você DEVE extrair perguntas, conceitos técnicos profundos e critérios de avaliação exatamente destas referências sempre que aplicável. Isso garante o alinhamento metodológico do simulador com a nossa própria base de conhecimento.

CONHECIMENTO DE REFERÊNCIA RECUPERADO (RAG):
${retrievedContext || "Nenhum documento específico carregado. Faça perguntas de nível técnico correspondente à senioridade."}

COMO INICIAR:
Se a conversa estiver começando agora (nenhum input prévio do usuário), dê as boas-vindas ao candidato para a entrevista de "${category}" nível "${seniority}", explique brevemente a dinâmica (3 perguntas + feedback final) e mande a PRIMEIRA pergunta desafiadora imediatamente.`;
}
