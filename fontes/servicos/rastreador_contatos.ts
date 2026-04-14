import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arquivo onde os IDs dos chats serão persistidos
const ARQUIVO_CONTATOS = path.join(__dirname, '..', '..', 'banco_de_dados', 'estado', 'contatos.json');

/**
 * Carrega a lista de contatos do disco.
 */
export function carregarContatos() {
  try {
    if (!fs.existsSync(ARQUIVO_CONTATOS)) return { privados: [], grupos: [] };
    const conteudoBruto = fs.readFileSync(ARQUIVO_CONTATOS, 'utf8');
    const dados = JSON.parse(conteudoBruto);
    return {
      privados: Array.isArray(dados.privados) ? dados.privados : [],
      grupos: Array.isArray(dados.grupos) ? dados.grupos : []
    };
  } catch (erro) {
    return { privados: [], grupos: [] };
  }
}

/**
 * Salva a lista de contatos no disco.
 */
export function salvarContatos(dados: { privados: string[], grupos: string[] }): boolean {
  try {
    const pai = path.dirname(ARQUIVO_CONTATOS);
    if (!fs.existsSync(pai)) fs.mkdirSync(pai, { recursive: true });
    fs.writeFileSync(ARQUIVO_CONTATOS, JSON.stringify(dados, null, 2));
    return true;
  } catch (erro) {
    return false;
  }
}

/**
 * Registra um novo JID (identificador do chat) nas listas, se ainda não estiver presente.
 */
export function registrarContato(jid: string): void {
  if (!jid || typeof jid !== 'string') return;
  const dados = carregarContatos();
  const ehGrupo = jid.endsWith('@g.us');
  const lista = ehGrupo ? dados.grupos : dados.privados;

  if (!lista.includes(jid)) {
    lista.push(jid);
    salvarContatos(dados);
  }
}

/**
 * Retorna uma lista filtrada de contatos registrados.
 */
export function obterListaContatos(tipo: 'privados' | 'grupos' | 'todos' = 'todos'): string[] {
  const dados = carregarContatos();
  if (tipo === 'privados') return dados.privados;
  if (tipo === 'grupos') return dados.grupos;
  return [...dados.privados, ...dados.grupos];
}
