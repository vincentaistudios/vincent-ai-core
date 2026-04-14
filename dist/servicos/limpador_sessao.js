import fs from 'node:fs';
import path from 'node:path';
/**
 * Divide uma string bruta (vinda de env ou config) em uma lista filtrada.
 */
function dividirLista(bruto) {
    return String(bruto || '')
        .split(/[\n,]+/g)
        .map((x) => String(x || '').trim())
        .filter(Boolean);
}
/**
 * Verifica se o nome do arquivo corresponde a algum padrão da lista (suporta curingas básicos *).
 */
function correspondeAPadrao(nome, padroes) {
    const n = String(nome || '');
    for (const p of padroes) {
        if (!p)
            continue;
        if (p === n)
            return true;
        if (p.startsWith('*') && n.endsWith(p.slice(1)))
            return true;
        if (p.endsWith('*') && n.startsWith(p.slice(0, -1)))
            return true;
    }
    return false;
}
/**
 * Lista todos os arquivos simples de um diretório.
 */
function listarArquivos(diretorio) {
    try {
        return fs.readdirSync(diretorio, { withFileTypes: true })
            .filter((d) => d.isFile())
            .map((d) => d.name);
    }
    catch {
        return [];
    }
}
/**
 * Obtém informações (stats) de um arquivo de forma segura contra erros de acesso.
 */
function obterStatusSeguro(caminho) {
    try {
        return fs.statSync(caminho);
    }
    catch {
        return null;
    }
}
/**
 * Limpa o diretório de sessões do WhatsApp, mantendo apenas os arquivos mais recentes e importantes.
 * Isso evita que a pasta cresça infinitamente.
 */
export function limparDiretorioSessao(diretorioSessao, opcoes = {}) {
    const habilitado = opcoes.habilitado ?? (process.env.SESSION_CLEAN_ENABLED === '1' || true);
    if (!habilitado)
        return { ok: true, pulado: true, deletados: 0, mantidos: 0 };
    const manterBruto = Number(opcoes.keep ?? process.env.SESSION_CLEAN_KEEP ?? 20);
    const manter = Number.isFinite(manterBruto) ? Math.max(0, manterBruto) : 20;
    const listaBranca = dividirLista(opcoes.whitelist ?? process.env.SESSION_CLEAN_WHITELIST);
    if (!listaBranca.includes('creds.json')) {
        listaBranca.push('creds.json');
    }
    const nomes = listarArquivos(diretorioSessao);
    const entradas = [];
    for (const nome of nomes) {
        const completo = path.join(diretorioSessao, nome);
        const status = obterStatusSeguro(completo);
        if (!status)
            continue;
        entradas.push({ nome, completo, mtimeMs: status.mtimeMs });
    }
    // Ordena por data de modificação: os arquivos mais recentes ficam no início
    entradas.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const conjuntoManter = new Set();
    // 1. Sempre manter o que está na lista branca
    for (const e of entradas) {
        if (correspondeAPadrao(e.nome, listaBranca)) {
            conjuntoManter.add(e.nome);
        }
    }
    // 2. Além disso, manter os últimos X arquivos mais recentes
    for (const e of entradas.slice(0, manter)) {
        conjuntoManter.add(e.nome);
    }
    let deletados = 0;
    for (const e of entradas) {
        if (conjuntoManter.has(e.nome))
            continue;
        try {
            fs.unlinkSync(e.completo);
            deletados += 1;
        }
        catch {
            // Ignora falhas ao deletar (arquivo bloqueado, etc)
        }
    }
    return {
        ok: true,
        pulado: false,
        deletados: deletados,
        mantidos: conjuntoManter.size,
        total: entradas.length
    };
}
