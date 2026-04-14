/**
 * QR Code — Migrado do Nazuna (qrcode.js)
 * Gera e lê QR Codes sem dependências de imagem locais.
 */
import axios from 'axios';

const CONFIG = {
  TAMANHO: 300,
  API_GERAR: 'https://api.qrserver.com/v1/create-qr-code/',
  API_LER: 'https://api.qrserver.com/v1/read-qr-code/',
};

function ehURL(texto: string): boolean {
  try { new URL(texto); return true; } catch { return /^(https?:\/\/|www\.)/i.test(texto); }
}

function formatarResultadoLeitura(dados: string): string {
  let tipo = '📝 Texto';
  let extra = '';
  if (ehURL(dados)) { tipo = '🔗 URL'; extra = '\n\n⚠️ Cuidado ao acessar links desconhecidos!'; }
  else if (dados.startsWith('mailto:')) tipo = '📧 Email';
  else if (dados.startsWith('tel:')) tipo = '📞 Telefone';
  else if (dados.startsWith('WIFI:')) tipo = '📶 Wi-Fi';
  else if (dados.startsWith('BEGIN:VCARD')) tipo = '👤 Contato (vCard)';
  else if (/^[0-9]{8,}$/.test(dados)) tipo = '📊 Código de Barras';
  return `✅ *QR CODE LIDO*\n\n🏷️ Tipo: ${tipo}\n\n📝 *Conteúdo:*\n${dados}${extra}`;
}

/** Gera um QR Code a partir de um texto e retorna o buffer da imagem. */
export async function gerarQRCode(texto: string, tamanho = CONFIG.TAMANHO) {
  if (!texto?.trim()) return { ok: false, erro: 'texto_vazio' };
  if (texto.length > 2000) return { ok: false, erro: 'texto_muito_longo' };
  try {
    const url = `${CONFIG.API_GERAR}?size=${tamanho}x${tamanho}&data=${encodeURIComponent(texto)}`;
    const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    return {
      ok: true,
      buffer: Buffer.from(resp.data),
      mensagem: `✅ *QR CODE GERADO*\n\n📝 ${texto.slice(0, 100)}${texto.length > 100 ? '...' : ''}`,
    };
  } catch { return { ok: false, erro: 'falha_geracao' }; }
}

/** Lê um QR Code a partir de um Buffer de imagem ou URL. */
export async function lerQRCode(entrada: Buffer | string) {
  try {
    let resposta: any;
    if (Buffer.isBuffer(entrada)) {
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      form.append('file', entrada, { filename: 'qrcode.png', contentType: 'image/png' });
      resposta = await axios.post(CONFIG.API_LER, form, { headers: form.getHeaders(), timeout: 15000 });
    } else {
      resposta = await axios.get(`${CONFIG.API_LER}?fileurl=${encodeURIComponent(entrada)}`, { timeout: 15000 });
    }
    const resultado = resposta.data;
    if (Array.isArray(resultado) && resultado[0]?.symbol?.[0]) {
      const symbol = resultado[0].symbol[0];
      if (symbol.error) return { ok: false, erro: symbol.error };
      if (symbol.data) return { ok: true, dados: symbol.data, mensagem: formatarResultadoLeitura(symbol.data) };
    }
    return { ok: false, erro: 'nenhum_qrcode_encontrado' };
  } catch { return { ok: false, erro: 'falha_leitura' }; }
}

/** Retorna a URL direta para um QR Code (sem download). */
export function obterURLQRCode(texto: string, tamanho = CONFIG.TAMANHO): string {
  return `${CONFIG.API_GERAR}?size=${tamanho}x${tamanho}&data=${encodeURIComponent(texto)}`;
}
