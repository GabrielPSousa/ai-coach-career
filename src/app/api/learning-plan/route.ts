import { NextRequest, NextResponse } from 'next/server';
import { generateLearningPlan } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { missingSkills, resumeSummary } = body;

    if (!missingSkills || !Array.isArray(missingSkills) || missingSkills.length === 0) {
      return NextResponse.json(
        { error: 'Parâmetro missingSkills deve ser um array não vazio.' },
        { status: 400 }
      );
    }

    // Invocar o Agent 3 (Learning Planner com RAG)
    const learningPlan = await generateLearningPlan(missingSkills, resumeSummary);

    return NextResponse.json({
      success: true,
      learningPlan,
    });

  } catch (error) {
    console.error('Erro na rota de plano de estudos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao gerar o plano de estudos.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
