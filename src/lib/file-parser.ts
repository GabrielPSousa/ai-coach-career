import mammoth from 'mammoth';

/**
 * Extrai texto a partir do buffer de um arquivo PDF
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Polyfill para evitar o erro "DOMMatrix is not defined" em ambientes Node.js
    if (typeof globalThis !== 'undefined' && !('DOMMatrix' in globalThis)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).DOMMatrix = class DOMMatrix {};
    }
    if (typeof global !== 'undefined' && !('DOMMatrix' in global)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).DOMMatrix = class DOMMatrix {};
    }

    // Carregar o pdf-parse dinamicamente usando require para evitar problemas de compatibilidade ESM no build
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const res = await parser.getText();
    return res.text || '';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao parsear arquivo PDF: ${errorMessage}`);
  }
}

/**
 * Extrai texto a partir do buffer de um arquivo DOCX (Word)
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Erro ao parsear arquivo DOCX: ${errorMessage}`);
  }
}

/**
 * Função unificada que identifica o tipo de arquivo por extensão/mimeType e extrai o texto bruto
 */
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return parsePdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return parseDocx(buffer);
  }

  if (mimeType.startsWith('text/') || ext === 'txt' || ext === 'md' || ext === 'json') {
    return buffer.toString('utf-8');
  }

  throw new Error(
    `Formato de arquivo não suportado: "${filename}". Por favor, envie arquivos em formato PDF, DOCX ou TXT.`
  );
}
