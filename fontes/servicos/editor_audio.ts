/**
 * Editor de Áudio — Migrado do Nazuna (audioEdit.js)
 * Requer: ffmpeg instalado no sistema
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIR_TEMP = path.join(__dirname, '../..', 'banco_de_dados', 'temp', 'audio');

const CONFIG = {
  DURACAO_MAXIMA: 300,
  DURACAO_MINIMA: 1,
  VELOCIDADE_MIN: 0.5,
  VELOCIDADE_MAX: 3.0,
};

function garantirDirTemp() {
  if (!fs.existsSync(DIR_TEMP)) fs.mkdirSync(DIR_TEMP, { recursive: true });
}

function gerarCaminhoTemp(extensao = 'mp3'): string {
  garantirDirTemp();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  return path.join(DIR_TEMP, `audio_${id}.${extensao}`);
}

function limparTemp(caminho: string) {
  try { if (fs.existsSync(caminho)) fs.unlinkSync(caminho); } catch {}
}

function formatarTempo(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function parsearTempo(tempo: string | number): number | null {
  if (typeof tempo === 'number') return tempo;
  const partes = String(tempo).split(':').map(Number);
  if (partes.some(isNaN)) return null;
  if (partes.length === 1) return partes[0];
  if (partes.length === 2) return partes[0]! * 60 + partes[1]!;
  if (partes.length === 3) return partes[0]! * 3600 + partes[1]! * 60 + partes[2]!;
  return null;
}

async function obterDuracaoAudio(caminho: string): Promise<number | null> {
  try {
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${caminho}"`);
    return parseFloat(stdout.trim());
  } catch { return null; }
}

/** Corta um trecho do áudio */
export async function cortarAudio(bufferAudio: Buffer, inicio: string | number, fim: string | number) {
  const start = parsearTempo(inicio);
  const end = parsearTempo(fim);
  if (start === null || end === null) return { ok: false, erro: 'formato_tempo_invalido' };
  if (start < 0 || end < 0 || start >= end) return { ok: false, erro: 'tempo_invalido' };
  if ((end - start) > CONFIG.DURACAO_MAXIMA) return { ok: false, erro: 'muito_longo' };

  const entrada = gerarCaminhoTemp('input');
  const saida = gerarCaminhoTemp('mp3');
  try {
    fs.writeFileSync(entrada, bufferAudio);
    const duracao = await obterDuracaoAudio(entrada);
    if (duracao && end > duracao) { limparTemp(entrada); return { ok: false, erro: 'tempo_excede_duracao' }; }
    await execAsync(`ffmpeg -y -i "${entrada}" -ss ${start} -to ${end} -c:a libmp3lame -q:a 2 "${saida}"`);
    const resultado = fs.readFileSync(saida);
    limparTemp(entrada); limparTemp(saida);
    return { ok: true, buffer: resultado, mensagem: `✂️ *ÁUDIO CORTADO*\n⏱️ De: ${formatarTempo(start)} → Até: ${formatarTempo(end)}\n📊 Duração: ${formatarTempo(end - start)}` };
  } catch (e) { limparTemp(entrada); limparTemp(saida); return { ok: false, erro: 'falha_ffmpeg' }; }
}

/** Altera a velocidade do áudio (0.5x a 3.0x) */
export async function alterarVelocidade(bufferAudio: Buffer, velocidade: number) {
  if (isNaN(velocidade) || velocidade < CONFIG.VELOCIDADE_MIN || velocidade > CONFIG.VELOCIDADE_MAX)
    return { ok: false, erro: 'velocidade_invalida' };

  let filtros: string[] = [];
  let v = velocidade;
  while (v < 0.5) { filtros.push('atempo=0.5'); v /= 0.5; }
  while (v > 2.0) { filtros.push('atempo=2.0'); v /= 2.0; }
  filtros.push(`atempo=${v}`);

  const entrada = gerarCaminhoTemp('input');
  const saida = gerarCaminhoTemp('mp3');
  try {
    fs.writeFileSync(entrada, bufferAudio);
    await execAsync(`ffmpeg -y -i "${entrada}" -filter:a "${filtros.join(',')}" -c:a libmp3lame -q:a 2 "${saida}"`);
    const resultado = fs.readFileSync(saida);
    limparTemp(entrada); limparTemp(saida);
    const emoji = velocidade > 1 ? '⏩' : velocidade < 1 ? '⏪' : '▶️';
    return { ok: true, buffer: resultado, mensagem: `${emoji} *VELOCIDADE ALTERADA*\n📊 ${(velocidade * 100).toFixed(0)}%` };
  } catch { limparTemp(entrada); limparTemp(saida); return { ok: false, erro: 'falha_ffmpeg' }; }
}

/** Reverte o áudio (toca ao contrário) */
export async function reverterAudio(bufferAudio: Buffer) {
  const entrada = gerarCaminhoTemp('input');
  const saida = gerarCaminhoTemp('mp3');
  try {
    fs.writeFileSync(entrada, bufferAudio);
    await execAsync(`ffmpeg -y -i "${entrada}" -af "areverse" -c:a libmp3lame -q:a 2 "${saida}"`);
    const resultado = fs.readFileSync(saida);
    limparTemp(entrada); limparTemp(saida);
    return { ok: true, buffer: resultado, mensagem: '🔄 *ÁUDIO REVERTIDO*\nO áudio agora toca ao contrário!' };
  } catch { limparTemp(entrada); limparTemp(saida); return { ok: false, erro: 'falha_ffmpeg' }; }
}

/** Aplica bass boost no áudio */
export async function bassBoost(bufferAudio: Buffer, ganho = 10) {
  const g = Math.min(20, Math.max(1, ganho));
  const entrada = gerarCaminhoTemp('input');
  const saida = gerarCaminhoTemp('mp3');
  try {
    fs.writeFileSync(entrada, bufferAudio);
    await execAsync(`ffmpeg -y -i "${entrada}" -af "bass=g=${g}:f=110:w=0.6" -c:a libmp3lame -q:a 2 "${saida}"`);
    const resultado = fs.readFileSync(saida);
    limparTemp(entrada); limparTemp(saida);
    return { ok: true, buffer: resultado, mensagem: `🔊 *BASS BOOST*\n📊 Ganho: +${g} dB` };
  } catch { limparTemp(entrada); limparTemp(saida); return { ok: false, erro: 'falha_ffmpeg' }; }
}

/** Normaliza o volume do áudio */
export async function normalizarVolume(bufferAudio: Buffer) {
  const entrada = gerarCaminhoTemp('input');
  const saida = gerarCaminhoTemp('mp3');
  try {
    fs.writeFileSync(entrada, bufferAudio);
    await execAsync(`ffmpeg -y -i "${entrada}" -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a libmp3lame -q:a 2 "${saida}"`);
    const resultado = fs.readFileSync(saida);
    limparTemp(entrada); limparTemp(saida);
    return { ok: true, buffer: resultado, mensagem: '🔊 *VOLUME NORMALIZADO*\nVolume ajustado para nível padrão.' };
  } catch { limparTemp(entrada); limparTemp(saida); return { ok: false, erro: 'falha_ffmpeg' }; }
}
