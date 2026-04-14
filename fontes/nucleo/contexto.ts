import NodeCache from "node-cache";
import pino from 'pino';
import fs from 'fs';
import chalk from 'chalk';
import mimetype from "mime-types";
import moment from 'moment-timezone';
// @ts-ignore
import encodeUrl from 'encodeurl';
import os from "os";
import util from 'util';
import { exec } from 'child_process';
import colors from "colors";
import { Boom } from '@hapi/boom';
import path from 'path';
import { fileURLToPath } from 'url';
import { configuracoesBot, nomeBot } from './configuracao.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração delegada ao módulo de configuração base para evitar ciclos
export { configuracoesBot, nomeBot };
export const marca = `[${nomeBot}]`;

export const cor = () => "";
export const corFundo = () => "";

/**
 * Gera um nome de arquivo aleatório com a extensão fornecida.
 */
export function obterAleatorio(extensao: string): string {
  return `${Math.floor(Math.random() * 10000)}${extensao}`;
}
export const getRandom = obterAleatorio;

export let menu: any;
try {
  const { menu: menuCarregado } = await import('../menus/menu.js');
  menu = menuCarregado;
} catch {
  menu = () => ({});
}

// Definições de tempo e data
export const tempo = () => moment.tz('America/Sao_Paulo').format('HH:mm:ss');
export const hora = () => moment.tz('America/Sao_Paulo').format('HH:mm:ss');
export const data = () => moment.tz('America/Sao_Paulo').format('DD/MM/YYYY');

/**
 * Formata segundos em uma string de horas, minutos e segundos.
 */
export function formatarTempoHms(segundos: number): string {
  const formatarDígito = (s: number) => (s < 10 ? '0' : '') + s;
  const horas = Math.floor(segundos / (60 * 60));
  const minutos = Math.floor(segundos % (60 * 60) / 60);
  const segs = Math.floor(segundos % 60);
  return `${formatarDígito(horas)} horas, ${formatarDígito(minutos)} minutos e ${formatarDígito(segs)} segundos.`;
}

/**
 * Retorna o tempo de atividade formatado.
 */
export const tempoAtividade = function(segundos: number): string {
  const sNum = Number(segundos);
  const d = Math.floor(sNum / (3600 * 24));
  const h = Math.floor(sNum % (3600 * 24) / 3600);
  const m = Math.floor(sNum % 3600 / 60);
  const s = Math.floor(sNum % 60);
  
  const dDisplay = d > 0 ? d + (d === 1 ? " dia, " : " dias, ") : "";
  const hDisplay = h > 0 ? h + (h === 1 ? " hora, " : " horas, ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " minuto, " : " minutos, ") : "";
  const sDisplay = s > 0 ? s + (s === 1 ? " segundo" : " segundos") : "";
  
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

const comandosUsadosRecentemente = new Set<string>();
export const estaFiltrado = (de: string) => !!comandosUsadosRecentemente.has(de);
export const adicionarFiltro = (de: string) => {
  comandosUsadosRecentemente.add(de);
  setTimeout(() => comandosUsadosRecentemente.delete(de), 10000);
}

/**
 * Retorna o diretório da sessão, criando-o se necessário.
 */
export const obterDiretorioSessao = () => {
  const diretórioSessão = path.join(__dirname, '..', '..', 'banco_de_dados', 'sessao');
  try {
    const pai = path.dirname(diretórioSessão);
    if (!fs.existsSync(pai)) {
      fs.mkdirSync(pai, { recursive: true });
    }
  } catch (erro) {
    console.error("Erro ao garantir diretório da sessão:", erro);
  }
  return diretórioSessão;
}

/**
 * Limpa arquivos temporários da sessão do Baileys para manter o projeto leve.
 */
export const limparArquivosSessao = () => {
  const diretório = obterDiretorioSessao();
  if (!fs.existsSync(diretório)) return;
  const nomesArquivos = fs.readdirSync(diretório);
  for (const nome of nomesArquivos) {
    const deveDeletar =
      nome.startsWith("pre-key-") ||
      nome.startsWith("sender-key-") ||
      nome.startsWith("sender-key-memory-") ||
      nome.startsWith("session-");
    
    if (!deveDeletar) continue;
    try {
      fs.rmSync(path.join(diretório, nome), { force: true });
    } catch (erro) {
      void 0;
    }
  }
}

/**
 * Gerencia a reconexão e limpeza programada da sessão.
 */
export const gerenciadorReconexaoSessao = async (horaAtual: string, upsert: any) => {
  switch (horaAtual) {
    case '07:00:00': case '12:00:00': case '18:00:00': case '00:00:00': {
      limparArquivosSessao();
      setTimeout(async () => {
        // Reinício dinâmico se necessário (pode ser ajustado conforme a lógica do orquestrador)
        console.log(colors.blue(`${marca} Reiniciando para otimização de sessão...`));
      }, 1200);
      break;
    }
  }
  if (upsert?.messages === undefined) return;
}

export { 
  fs, 
  logger, 
  chalk, 
  mimetype, 
  moment, 
  encodeUrl, 
  os, 
  util, 
  exec, 
  NodeCache, 
  Boom, 
  colors, 
  path 
};
