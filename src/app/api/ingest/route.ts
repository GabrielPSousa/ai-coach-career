import { NextResponse } from 'next/server';
import { ingestKnowledge } from '@/lib/ingestion';

// Permitir requisições GET para facilidade de testes manuais no navegador
export async function GET() {
  try {
    const result = await ingestKnowledge();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro inesperado na rota de ingestão';
    return NextResponse.json(
      {
        success: false,
        processedDocuments: 0,
        totalChunks: 0,
        errors: [errorMessage],
      },
      { status: 500 }
    );
  }
}

// Permitir requisições POST para acionamento formal
export async function POST() {
  try {
    const result = await ingestKnowledge();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro inesperado na rota de ingestão';
    return NextResponse.json(
      {
        success: false,
        processedDocuments: 0,
        totalChunks: 0,
        errors: [errorMessage],
      },
      { status: 500 }
    );
  }
}
