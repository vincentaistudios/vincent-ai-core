import { obterConfiguracaoModelosGroq, groqConversarComChave, groqTranscreverComChave } from './cliente_groq.js';
import { obterPoolChavesGroq } from './pool_chaves_groq.js';
import { podeUsarChave, registrarUso } from './uso_chaves_groq.js';
import { buscarNaWeb, formatarResultadosParaIA } from './busca_web.js';
let indiceRoundRobin = 0;
const chaveRuimAte = new Map();
/**
 * Converte um buffer de imagem em uma URL de dados (Base64).
 */
function converterBufferParaDataUrl(buffer, tipoMime) {
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${tipoMime || 'application/octet-stream'};base64,${base64}`;
}
/**
 * Verifica se uma chave está marcada como "ruim" temporariamente.
 */
function ehChaveRuim(idChave, agoraMs) {
    const ate = Number(chaveRuimAte.get(idChave) || 0);
    return agoraMs < ate;
}
/**
 * Marca uma chave como ruim por um período determinado.
 */
function marcarChaveRuim(idChave, ms = 60000) {
    const tempoVida = Number.isFinite(ms) ? Math.max(1000, ms) : 60000;
    chaveRuimAte.set(idChave, Date.now() + tempoVida);
}
const esperar = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
/**
 * Escolhe a melhor chave disponível no pool usando Round Robin e verificando limites de uso.
 */
function escolherChave(agora = new Date()) {
    const pool = obterPoolChavesGroq();
    if (pool.length === 0)
        return { ok: false, motivo: 'sem_chaves' };
    const agoraMs = agora.getTime();
    const inicio = indiceRoundRobin % pool.length;
    indiceRoundRobin = (indiceRoundRobin + 1) % pool.length;
    let melhorRetry = null;
    for (let i = 0; i < pool.length; i++) {
        const k = pool[(inicio + i) % pool.length];
        if (!k)
            continue;
        if (ehChaveRuim(k.id, agoraMs))
            continue;
        const resultado = podeUsarChave(k.id, agora);
        if (resultado.ok) {
            return { ok: true, idChave: k.id, chaveApi: k.apiKey };
        }
        if (typeof resultado.retryAfterSec === 'number') {
            if (!melhorRetry || resultado.retryAfterSec < melhorRetry.retryAfterSec) {
                melhorRetry = { motivo: resultado.reason || 'rate_limit', retryAfterSec: resultado.retryAfterSec };
            }
        }
    }
    if (melhorRetry)
        return { ok: false, motivo: melhorRetry.motivo, retryAfterSec: melhorRetry.retryAfterSec };
    return { ok: false, motivo: 'limite_atingido' };
}
/**
 * Executa uma operação na Groq tentando várias chaves do pool se necessário.
 */
async function chamarComChaveDoPool({ userId, operacao, parametros, agora = new Date() }) {
    const pool = obterPoolChavesGroq();
    const maxTentativas = Math.max(1, pool.length);
    for (let i = 0; i < maxTentativas; i++) {
        const escolhida = escolherChave(agora);
        if (!escolhida.ok)
            return { ok: false, erro: escolhida.motivo || 'sem_chaves', retryAfterSec: escolhida.retryAfterSec };
        try {
            if (operacao === 'conversa') {
                const uso = registrarUso(escolhida.idChave, agora);
                const res = await groqConversarComChave({
                    chaveApi: escolhida.chaveApi,
                    mensagens: parametros.mensagens,
                    modelo: parametros.modelo,
                    temperatura: parametros.temperatura,
                    maxTokens: parametros.maxTokens
                });
                return { ok: true, idChave: escolhida.idChave, uso, ...res };
            }
            if (operacao === 'transcrever') {
                const uso = registrarUso(escolhida.idChave, agora);
                const res = await groqTranscreverComChave({
                    chaveApi: escolhida.chaveApi,
                    bufferArquivo: parametros.bufferArquivo,
                    nomeArquivo: parametros.nomeArquivo,
                    tipoMime: parametros.tipoMime,
                    modelo: parametros.modelo
                });
                return { ok: true, idChave: escolhida.idChave, uso, ...res };
            }
            return { ok: false, erro: 'operacao_invalida' };
        }
        catch (erro) {
            if (erro.status === 401 || erro.status === 403) {
                marcarChaveRuim(escolhida.idChave, 24 * 3600 * 1000);
                continue;
            }
            if (erro.status === 429 || (erro.status >= 500 && erro.status <= 599)) {
                marcarChaveRuim(escolhida.idChave, 60 * 1000);
                continue;
            }
            return { ok: false, erro: erro.message || 'erro_api' };
        }
    }
    return { ok: false, erro: 'todas_chaves_falharam' };
}
/**
 * Decide se o robô deve responder a uma mensagem baseada no contexto (roteamento inteligente).
 */
export async function groqDecidirRota({ userId, chatId, texto, temMedia, ehGrupo }) {
    const modelos = obterConfiguracaoModelosGroq();
    const mensagens = [
        { role: 'system', content: 'Você é um roteador de mensagens. Responda APENAS com JSON: {"shouldRespond":true|false}.' },
        { role: 'user', content: JSON.stringify({ chatId, ehGrupo, temMedia, texto: String(texto || '').slice(0, 1000) }) }
    ];
    const r = await chamarComChaveDoPool({
        userId,
        operacao: 'conversa',
        parametros: { mensagens, modelo: modelos.rota, temperatura: 0, maxTokens: 64 }
    });
    if (!r.ok)
        return { ok: false, erro: r.erro };
    try {
        const objeto = JSON.parse(String(r.conteudo || '').trim());
        return { ok: true, deveResponder: Boolean(objeto && objeto.shouldRespond) };
    }
    catch {
        return { ok: true, deveResponder: false };
    }
}
/**
 * Responde a um prompt de texto usando o pool de chaves.
 * Suporta busca web em tempo real (RAG).
 */
export async function groqResponderTexto({ userId, prompt, promptSistema, modelo, usarBusca = false }) {
    const modelos = obterConfiguracaoModelosGroq();
    let promptFinal = String(prompt || '').slice(0, 10000);
    if (usarBusca) {
        const resultados = await buscarNaWeb(promptFinal);
        if (resultados.length > 0) {
            const contextoBusca = formatarResultadosParaIA(resultados);
            promptFinal = `SEARCH CONTEXT / CONTEXTO DE BUSCA:\n${contextoBusca}\n\nUSER QUESTION / PERGUNTA DO USUÁRIO: ${promptFinal}\n\nResponda no mesmo idioma do usuário com base no contexto acima se relevante. / Respond in the user's language based on the context above if relevant.`;
        }
    }
    const promptSistemaPadrao = "Você é um assistente útil. Detecte o idioma da mensagem do usuário e responda no mesmo idioma. Se o idioma for desconhecido ou pouco claro, responda em Português (Brasil). Mantenha o tom prestativo e objetivo.";
    const mensagens = [
        { role: 'system', content: String(promptSistema || promptSistemaPadrao) },
        { role: 'user', content: promptFinal }
    ];
    const r = await chamarComChaveDoPool({
        userId,
        operacao: 'conversa',
        parametros: { mensagens, modelo: modelo || modelos.texto, temperatura: 0.2 }
    });
    if (!r.ok)
        return { ok: false, erro: r.erro };
    return { ok: true, texto: String(r.conteudo || '').trim() };
}
/**
 * Responde a uma mensagem com imagem (VLM).
 */
export async function groqResponderImagem({ userId, prompt, bufferImagem, tipoMime }) {
    const modelos = obterConfiguracaoModelosGroq();
    const url = converterBufferParaDataUrl(bufferImagem, tipoMime || 'image/jpeg');
    const mensagens = [
        { role: 'system', content: 'Você analisa imagens. Detecte o idioma do usuário e responda no mesmo idioma (Padrão: Português BR).' },
        {
            role: 'user',
            content: [
                { type: 'text', text: String(prompt || 'Descreva a imagem.').slice(0, 2000) },
                { type: 'image_url', image_url: { url } }
            ]
        }
    ];
    const r = await chamarComChaveDoPool({
        userId,
        operacao: 'conversa',
        parametros: { mensagens, modelo: modelos.visao, temperatura: 0.2 }
    });
    if (!r.ok)
        return { ok: false, erro: r.erro };
    return { ok: true, texto: String(r.conteudo || '').trim() };
}
/**
 * Transcreve áudio para texto.
 */
export async function groqTranscrever({ userId, bufferArquivo, nomeArquivo, tipoMime }) {
    const modelos = obterConfiguracaoModelosGroq();
    const r = await chamarComChaveDoPool({
        userId,
        operacao: 'transcrever',
        parametros: { bufferArquivo, nomeArquivo, tipoMime, modelo: modelos.transcrever }
    });
    if (!r.ok)
        return { ok: false, erro: r.erro };
    return { ok: true, texto: String(r.texto || '').trim() };
}
