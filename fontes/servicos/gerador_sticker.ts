/**
 * Gerador de Stickers — Migrado do Nazuna (sticker.js)
 * Requer: ffmpeg, node-webpmux instalados
 */
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function garantirDirTemp() {
  const dir = path.join(__dirname, '../..', 'banco_de_dados', 'temp', 'stickers');
  if (!fsSync.existsSync(dir)) fsSync.mkdirSync(dir, { recursive: true });
  return dir;
}

function gerarCaminhoTemp(ext: string): string {
  const dir = garantirDirTemp();
  return path.join(dir, `${Date.now()}_${Math.floor(Math.random() * 1e6)}.${ext}`);
}

async function obterBuffer(url: string): Promise<Buffer> {
  const { data } = await axios.get(url, { responseType: 'arraybuffer' });
  if (!data || data.length === 0) throw new Error('Download vazio');
  return Buffer.from(data);
}

function detectarExtensaoImagem(buf: Buffer): string {
  if (buf.length >= 12) {
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png';
    if (buf[0] === 0xFF && buf[1] === 0xD8) return 'jpg';
    if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  }
  return 'jpg';
}

async function converterParaWebp(bufferMedia: Buffer, ehVideo = false, forcarQuadrado = false): Promise<Buffer> {
  // Se já for webp estático, retorna direto
  if (!ehVideo && bufferMedia.slice(0, 4).toString() === 'RIFF' && bufferMedia.slice(8, 12).toString() === 'WEBP')
    return bufferMedia;

  const { default: ffmpeg } = await import('fluent-ffmpeg');
  const ext = ehVideo ? 'mp4' : detectarExtensaoImagem(bufferMedia);
  const tmpEntrada = gerarCaminhoTemp(ext);
  await fs.writeFile(tmpEntrada, bufferMedia);

  const filtroBase = forcarQuadrado
    ? 'scale=320:320'
    : 'scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba';
  const filtros = ehVideo ? `${filtroBase},fps=15` : filtroBase;
  const TAMANHO_MAX = 990000;
  let qualidade = ehVideo ? 45 : 75;
  let bufferSaida: Buffer | null = null;

  for (let tentativas = 0; tentativas < 8; tentativas++) {
    const tmpSaida = gerarCaminhoTemp('webp');
    const opcoes = ['-vf', filtros, '-c:v', 'libwebp', '-lossless', '0', '-compression_level', '6', '-preset', 'default',
      ...(ehVideo ? ['-q:v', String(qualidade), '-loop', '0', '-an', '-vsync', '0', '-t', '8'] : ['-q:v', String(qualidade)])];

    await new Promise<void>((resolve, reject) => {
      (ffmpeg as any)(tmpEntrada).outputOptions(opcoes).format('webp')
        .on('error', reject).on('end', resolve).save(tmpSaida);
    });

    bufferSaida = await fs.readFile(tmpSaida).catch(() => null);
    await fs.unlink(tmpSaida).catch(() => {});
    if (!bufferSaida) throw new Error('Conversão falhou: saída vazia');
    if (bufferSaida.length <= TAMANHO_MAX) break;

    const fator = bufferSaida.length / TAMANHO_MAX;
    qualidade = Math.max(ehVideo ? 15 : 25, Math.floor(qualidade * (fator > 1.5 ? 0.6 : fator > 1.2 ? 0.75 : 0.9)));
  }

  await fs.unlink(tmpEntrada).catch(() => {});
  return bufferSaida!;
}

async function escreverExif(webpBuffer: Buffer, metadata: { packname?: string; author?: string }): Promise<Buffer> {
  try {
    const webp = await import('node-webpmux');
    const img = new webp.Image();
    await img.load(webpBuffer);
    const json = {
      'sticker-pack-id': 'vincent-ai-core',
      'sticker-pack-name': metadata.packname || 'Vincent AI',
      'sticker-pack-publisher': metadata.author || 'Vincent AI Core',
      'emojis': ['🤖']
    };
    const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    (img as any).exif = exif;
    return await img.save(null) as Buffer;
  } catch { return webpBuffer; }
}

async function resolverParaBuffer(entrada: Buffer | string): Promise<Buffer> {
  if (Buffer.isBuffer(entrada)) return entrada;
  if (typeof entrada === 'string') {
    if (/^data:.*?;base64,/i.test(entrada)) return Buffer.from(entrada.split(',')[1]!, 'base64');
    if (/^https?:\/\//i.test(entrada)) return obterBuffer(entrada);
    return fs.readFile(entrada);
  }
  throw new Error('Entrada de sticker inválida');
}

/**
 * Converte e envia uma imagem ou vídeo como sticker no WhatsApp.
 */
export async function enviarSticker(conexao: any, jid: string, opcoes: {
  sticker: Buffer | string;
  tipo?: 'image' | 'video';
  packname?: string;
  author?: string;
  forcarQuadrado?: boolean;
}, { quoted }: { quoted?: any } = {}) {
  const { sticker, tipo = 'image', packname = 'Vincent AI', author = 'Vincent AI Core', forcarQuadrado = false } = opcoes;
  const buffer = await resolverParaBuffer(sticker);
  let webpBuffer = await converterParaWebp(buffer, tipo === 'video', forcarQuadrado);
  if (packname || author) webpBuffer = await escreverExif(webpBuffer, { packname, author });
  await conexao.sendMessage(jid, { sticker: webpBuffer }, { quoted });
  return webpBuffer;
}
