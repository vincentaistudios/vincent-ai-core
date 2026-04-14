/**
 * Downloader de Mídias — Adaptado do Nazuna
 * Suporta: YouTube (MP3/MP4), Instagram, TikTok, Kwai, Spotify, SoundCloud.
 * 
 * IMPORTANTE: Requer configuração de API externa no .env:
 *   DOWNLOADER_API_URL=https://sua-api.com
 *   DOWNLOADER_API_KEY=sua_chave_aqui
 */
import axios from 'axios';
import { logger } from '../nucleo/contexto.js';

interface ResultadoDownloadSucesso {
  ok: true;
  buffer: Buffer;
  titulo: string;
  thumbnail?: string;
  artista?: string;
}

interface ResultadoDownloadErro {
  ok: false;
  erro: string;
  mensagem: string;
}

type ResultadoDownload = ResultadoDownloadSucesso | ResultadoDownloadErro;

function obterConfig() {
  const url = process.env.DOWNLOADER_API_URL;
  const chave = process.env.DOWNLOADER_API_KEY;
  if (!url || !chave) return null;
  return { url, chave };
}

async function baixarBuffer(urlArquivo: string): Promise<Buffer> {
  const resp = await axios.get(urlArquivo, { responseType: 'arraybuffer', timeout: 60000, maxRedirects: 5 });
  return Buffer.from(resp.data);
}

async function chamarAPI(endpoint: string, params: Record<string, string>): Promise<{ ok: true; data: any } | ResultadoDownloadErro> {
  const config = obterConfig();
  if (!config) return { ok: false, erro: 'api_nao_configurada', mensagem: '⚠️ A API de downloads não está configurada.\nAdicione *DOWNLOADER_API_URL* e *DOWNLOADER_API_KEY* no arquivo .env.' };
  try {
    const query = new URLSearchParams({ apikey: config.chave, ...params }).toString();
    const { data } = await axios.get(`${config.url}${endpoint}?${query}`, { timeout: 30000 });
    return { ok: true, data };
  } catch (e: any) {
    logger.error(e, 'Erro ao chamar API de downloads');
    return { ok: false, erro: 'falha_api', mensagem: '❌ Erro ao contatar o serviço de downloads.' };
  }
}

/** Pesquisa um vídeo no YouTube */
export async function pesquisarYoutube(consulta: string) {
  return chamarAPI('/api/pesquisa/youtube', { query: consulta });
}

/** Baixa o áudio de um vídeo do YouTube (MP3) */
export async function youtubeMP3(url: string): Promise<ResultadoDownload> {
  const res = await chamarAPI('/api/downloads/youtubemp3', { query: url });
  if (!res.ok) return res;
  const dlurl = res.data?.resposta?.dlurl;
  if (!dlurl) return { ok: false, erro: 'url_nao_encontrada', mensagem: '❌ Não foi possível obter o link de download.' };
  const buffer = await baixarBuffer(dlurl);
  return { ok: true, buffer, titulo: res.data.resposta.title || 'Áudio', thumbnail: res.data.resposta.thumbnail || '' };
}

/** Baixa um vídeo do YouTube (MP4) */
export async function youtubeMP4(url: string): Promise<ResultadoDownload> {
  const res = await chamarAPI('/api/downloads/youtubemp4', { query: url });
  if (!res.ok) return res;
  const dlurl = res.data?.resposta?.dlurl;
  if (!dlurl) return { ok: false, erro: 'url_nao_encontrada', mensagem: '❌ Não foi possível obter o link de download.' };
  const buffer = await baixarBuffer(dlurl);
  return { ok: true, buffer, titulo: res.data.resposta.title || 'Vídeo', thumbnail: res.data.resposta.thumbnail || '' };
}

/** Baixa vídeo/foto do Instagram */
export async function instagramDL(url: string): Promise<ResultadoDownload> {
  const res = await chamarAPI('/api/downloads/instagram', { query: url });
  if (!res.ok) return res;
  const dlurl = res.data?.resposta?.dlurl || res.data?.resposta?.url;
  if (!dlurl) return { ok: false, erro: 'url_nao_encontrada', mensagem: '❌ Não foi possível obter o link do Instagram.' };
  const buffer = await baixarBuffer(dlurl);
  return { ok: true, buffer, titulo: 'Instagram' };
}

/** Baixa vídeo do TikTok (sem marca d'água) */
export async function tiktokDL(url: string): Promise<ResultadoDownload> {
  const res = await chamarAPI('/api/downloads/tiktok', { query: url });
  if (!res.ok) return res;
  const dlurl = res.data?.resposta?.dlurl || res.data?.resposta?.nowm;
  if (!dlurl) return { ok: false, erro: 'url_nao_encontrada', mensagem: '❌ Não foi possível obter o vídeo do TikTok.' };
  const buffer = await baixarBuffer(dlurl);
  return { ok: true, buffer, titulo: res.data.resposta.title || 'TikTok' };
}

/** Baixa vídeo do Kwai */
export async function kwaiDL(url: string): Promise<ResultadoDownload> {
  const res = await chamarAPI('/api/downloads/kwai', { query: url });
  if (!res.ok) return res;
  const dlurl = res.data?.resposta?.dlurl;
  if (!dlurl) return { ok: false, erro: 'url_nao_encontrada', mensagem: '❌ Não foi possível obter o vídeo do Kwai.' };
  const buffer = await baixarBuffer(dlurl);
  return { ok: true, buffer, titulo: 'Kwai' };
}

/** Baixa prévia de música do Spotify */
export async function spotifyDL(url: string): Promise<ResultadoDownload> {
  const res = await chamarAPI('/api/downloads/spotify', { query: url });
  if (!res.ok) return res;
  const dlurl = res.data?.resposta?.dlurl;
  if (!dlurl) return { ok: false, erro: 'url_nao_encontrada', mensagem: '❌ Não foi possível obter o áudio do Spotify.' };
  const buffer = await baixarBuffer(dlurl);
  return { ok: true, buffer, titulo: res.data.resposta.title || 'Spotify', artista: res.data.resposta.artist || '' };
}

/** Baixa áudio do SoundCloud */
export async function soundcloudDL(url: string): Promise<ResultadoDownload> {
  const res = await chamarAPI('/api/downloads/soundcloud', { query: url });
  if (!res.ok) return res;
  const dlurl = res.data?.resposta?.dlurl;
  if (!dlurl) return { ok: false, erro: 'url_nao_encontrada', mensagem: '❌ Não foi possível obter o áudio do SoundCloud.' };
  const buffer = await baixarBuffer(dlurl);
  return { ok: true, buffer, titulo: res.data.resposta.title || 'SoundCloud' };
}

/** Baixa vídeo do Facebook */
export async function facebookDL(url: string): Promise<ResultadoDownload> {
  const res = await chamarAPI('/api/downloads/facebook', { query: url });
  if (!res.ok) return res;
  const dlurl = res.data?.resposta?.dlurl || res.data?.resposta?.url;
  if (!dlurl) return { ok: false, erro: 'url_nao_encontrada', mensagem: '❌ Não foi possível baixar do Facebook.' };
  const buffer = await baixarBuffer(dlurl);
  return { ok: true, buffer, titulo: 'Facebook Video' };
}

/** Pesquisa imagens no Pinterest */
export async function pinterestSearch(consulta: string) {
  return chamarAPI('/api/pesquisas/pinterest', { query: consulta });
}

/** Busca letras de música */
export async function buscarLetra(musica: string) {
  return chamarAPI('/api/pesquisa/letra', { query: musica });
}

/** Pesquisa APK Mods */
export async function pesquisarAPK(consulta: string) {
  // Nota: APKMod pode requerer roteamento diferente na API externa ou scraping direto
  // Por padrão, tentamos usar a API unificada se disponível
  return chamarAPI('/api/downloads/apkmod', { query: consulta });
}
