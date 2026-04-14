import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Remove aspas simples ou duplas das extremidades de uma string.
 */
function limparAspas(valor: string): string {
  const s = String(valor || '');
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Carrega manualmente um arquivo .env para o process.env.
 */
function carregarArquivoEnv(caminhoArquivo: string): boolean {
  try {
    if (!fs.existsSync(caminhoArquivo)) return false;
    const conteudoBruto = fs.readFileSync(caminhoArquivo, 'utf8');
    const linhas = conteudoBruto.split(/\r?\n/g);
    
    for (const linhaBruta of linhas) {
      const linha = String(linhaBruta || '').trim();
      if (!linha || linha.startsWith('#')) continue;
      
      const indiceIgual = linha.indexOf('=');
      if (indiceIgual <= 0) continue;
      
      const chave = linha.slice(0, indiceIgual).trim();
      const valor = limparAspas(linha.slice(indiceIgual + 1).trim());
      
      if (!chave) continue;
      // Define a variável apenas se ela ainda não existir no ambiente
      if (process.env[chave] == null) {
        process.env[chave] = valor;
      }
    }
    return true;
  } catch (erro) {
    console.error(`Falha ao carregar arquivo de ambiente: ${caminhoArquivo}`, erro);
    return false;
  }
}

/**
 * Carrega o arquivo .env da raiz do projeto.
 */
export function carregarVariaveisAmbiente(): boolean {
  const raiz = path.join(__dirname, '..', '..');
  return carregarArquivoEnv(path.join(raiz, '.env'));
}
