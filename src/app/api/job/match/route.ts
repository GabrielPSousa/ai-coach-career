import { NextRequest, NextResponse } from 'next/server';
import { matchJob } from '@/lib/agents';
import { supabase } from '@/lib/supabase';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, jobDescription, title, company } = body;

    if (!resumeText || !jobDescription || !title) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes: resumeText, jobDescription ou title.' },
        { status: 400 }
      );
    }

    // 1. Invocar o Agent 2 (Job Matcher) para comparar currículo e vaga
    const matchResult = await matchJob(resumeText, jobDescription);

    // 2. Salvar na tabela de vagas (jobs)
    const { data: jobRecord, error: insertError } = await supabase
      .from('jobs')
      .insert({
        user_id: DEFAULT_USER_ID,
        title,
        company: company || 'Empresa Confidencial',
        description: jobDescription,
        skills_required: matchResult.matchingSkills.concat(matchResult.missingSkills), // Guardando histórico de skills
        match_result: matchResult, // Objeto JSON contendo score, matches, gaps e dicas
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Erro ao salvar vaga no Supabase:', insertError);
      // Retorna o resultado mesmo se falhar ao persistir
      return NextResponse.json({
        success: true,
        jobId: null,
        matchResult,
        warning: 'Não foi possível salvar a vaga no banco, mas o cálculo de compatibilidade foi feito.'
      });
    }

    return NextResponse.json({
      success: true,
      jobId: jobRecord.id,
      matchResult,
    });

  } catch (error) {
    console.error('Erro na rota de match de vaga:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao realizar o match de vaga.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
