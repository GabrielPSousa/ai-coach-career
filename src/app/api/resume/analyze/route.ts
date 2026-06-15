import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/file-parser';
import { analyzeResume } from '@/lib/agents';
import { supabase } from '@/lib/supabase';

// ID de usuário constante para o MVP (sem necessidade de login inicial)
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function POST(request: NextRequest) {
  try {
    let resumeText = '';
    let filename = 'pasted-resume.txt';

    // Verificar o content-type para saber se é multipart/form-data ou JSON
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'Nenhum arquivo enviado.' },
          { status: 400 }
        );
      }

      filename = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Extrair o texto do arquivo usando o parser adequado
      resumeText = await extractTextFromFile(buffer, filename, file.type);
    } else {
      // Caso o usuário cole o texto diretamente
      const body = await request.json();
      resumeText = body.text || '';
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo do currículo está vazio.' },
        { status: 400 }
      );
    }

    // 1. Invocar o Agent 1 (Resume Analyzer) para extrair os metadados do currículo
    const analysis = await analyzeResume(resumeText);

    // 2. Persistir no Supabase
    const { data: resumeRecord, error: insertError } = await supabase
      .from('resumes')
      .insert({
        user_id: DEFAULT_USER_ID,
        content: resumeText,
        raw_text: filename,
        metadata: analysis, // campo jsonb no banco
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Erro ao salvar currículo no Supabase:', insertError);
      // Retornar a análise mesmo se falhar no banco para não travar a experiência do usuário
      return NextResponse.json({
        success: true,
        resumeId: null,
        text: resumeText,
        analysis,
        warning: 'Não foi possível salvar no banco, mas a análise foi concluída.'
      });
    }

    return NextResponse.json({
      success: true,
      resumeId: resumeRecord.id,
      text: resumeText,
      analysis,
    });

  } catch (error) {
    console.error('Erro na rota de análise de currículo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao processar o currículo.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
