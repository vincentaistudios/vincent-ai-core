import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Lê um arquivo JSON e retorna seu conteúdo ou um valor padrão em caso de erro.
 */
const lerJson = (caminhoArquivo: string, valorPadrao: any) => {
  try {
    if (fs.existsSync(caminhoArquivo)) {
      return JSON.parse(fs.readFileSync(caminhoArquivo, 'utf8'));
    }
  } catch (erro) {
    console.error(`Erro ao ler JSON em ${caminhoArquivo}:`, erro);
  }
  return valorPadrao;
};

// Caminho para o settings.json centralizado
const caminhoConfiguracoes = path.join(__dirname, '..', '..', 'banco_de_dados', 'configuracao', 'settings.json');

// Exportação da única fonte de verdade para as configurações do bot
const settings = lerJson(caminhoConfiguracoes, null);

if (!settings) {
  throw new Error(`[CONFIG] Arquivo obrigatório não encontrado ou inválido: ${caminhoConfiguracoes}`);
}

export const configuracoesBot = settings;
export const nomeBot = String(settings.nickbot || 'Bot WhatsApp').trim();
export const prefixoBot = String(settings.prefixo || '.').trim();
export const metodoPareamento = settings.metodo_pareamento || null; // 'code' | 'qr' | null
