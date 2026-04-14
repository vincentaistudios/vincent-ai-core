import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
/**
 * Extrai o texto contido em um documento enviado pelo usuário.
 * Suporta TXT, JSON, PDF e DOCX.
 */
export async function extrairTextoDocumento({ buffer, tipoMime, nomeArquivo } = {}) {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
    const mime = String(tipoMime || '').toLowerCase().trim();
    const nome = String(nomeArquivo || '').toLowerCase();
    if (!buf.length)
        return { ok: false, erro: 'vazio' };
    // Arquivos de texto puro
    if (mime.startsWith('text/')) {
        return { ok: true, texto: buf.toString('utf8') };
    }
    // Arquivos JSON
    if (mime === 'application/json') {
        try {
            const objeto = JSON.parse(buf.toString('utf8'));
            return { ok: true, texto: JSON.stringify(objeto, null, 2) };
        }
        catch {
            return { ok: true, texto: buf.toString('utf8') };
        }
    }
    // Arquivos PDF
    const ehPdf = mime === 'application/pdf' || nome.endsWith('.pdf');
    if (ehPdf) {
        try {
            const saida = await pdfParse(buf);
            return { ok: true, texto: String(saida?.text || '') };
        }
        catch (erro) {
            return { ok: false, erro: 'falha_processamento_pdf' };
        }
    }
    // Arquivos Word (DOCX)
    const ehDocx = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        nome.endsWith('.docx');
    if (ehDocx) {
        try {
            const saida = await mammoth.extractRawText({ buffer: buf });
            return { ok: true, texto: String(saida?.value || '') };
        }
        catch (erro) {
            return { ok: false, erro: 'falha_processamento_docx' };
        }
    }
    return { ok: false, erro: 'formato_nao_suportado' };
}
