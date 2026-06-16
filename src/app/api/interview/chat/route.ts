import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { getInterviewSimulatorPrompt } from "@/lib/agents";

// Desativar cache de renderização estática para rotas de chat streaming dinâmicas
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { category, seniority, messages } = await request.json();

    if (!category || !seniority || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error: "Parâmetros obrigatórios ausentes ou incorretos.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 1. Gerar o prompt do sistema customizado com o RAG da categoria correspondente
    const systemPrompt = await getInterviewSimulatorPrompt(category, seniority);

    // 1.5. Converter as UIMessages do frontend para ModelMessages compatíveis com o streamText do SDK
    const modelMessages = await convertToModelMessages(messages);

    // 2. Transmitir o stream de texto gerado pelo GPT-4o utilizando o Vercel AI SDK
    const result = streamText({
      model:
        process.env.CHAT_MODEL_PROVIDER === "google"
          ? google("gemini-2.5-flash")
          : openai("gpt-4o"),
      system: systemPrompt,
      messages: modelMessages, // mantém o histórico completo do chat convertido
    });

    // 3. Retornar a resposta em formato de fluxo de dados (Text Stream) para o frontend
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Erro na rota de chat do simulador de entrevista:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro interno no streaming de chat.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
