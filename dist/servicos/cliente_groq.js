import FormData from 'form-data';
const URL_BASE_PADRAO = 'https://api.groq.com/openai/v1';
/**
 * Obtém a configuração básica da Groq a partir das variáveis de ambiente.
 */
export function obterConfiguracaoGroq() {
    const chaveApi = String(process.env.GROQ_API_KEY || '').trim();
    const urlBase = String(process.env.GROQ_BASE_URL || URL_BASE_PADRAO).trim().replace(/\/+$/, '');
    const modelo = String(process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').trim();
    const tempoEsgotadoBruto = Number(process.env.GROQ_TIMEOUT_MS);
    const tempoEsgotadoMs = Number.isFinite(tempoEsgotadoBruto) ? Math.max(1000, tempoEsgotadoBruto) : 15_000;
    return { chaveApi, urlBase, modelo, tempoEsgotadoMs };
}
export const APELIDOS_MODELOS = {
    'rápido': 'llama-3.1-8b-instant',
    'inteligente': 'llama-3.3-70b-versatile',
    'visão': 'llama-3.2-11b-vision-preview',
    'áudio': 'whisper-large-v3'
};
/**
 * Resolve um apelido amigável para o ID real do modelo na Groq.
 */
export function resolverModelo(apelidoOuId) {
    return APELIDOS_MODELOS[String(apelidoOuId).toLowerCase()] || apelidoOuId;
}
/**
 * Obtém a configuração dos modelos específicos para cada tarefa.
 */
export function obterConfiguracaoModelosGroq() {
    return {
        texto: resolverModelo(process.env.GROQ_MODEL_TEXT || process.env.GROQ_MODEL || 'inteligente'),
        rota: resolverModelo(process.env.GROQ_MODEL_ROUTE || 'llama-3.1-8b-instant'),
        visao: resolverModelo(process.env.GROQ_MODEL_VISION || 'visão'),
        transcrever: resolverModelo(process.env.GROQ_MODEL_TRANSCRIBE || 'áudio')
    };
}
/**
 * Resolve as configurações finais mesclando padrões com sobreposições.
 */
function resolverConfiguracao(sobreposicoes = {}) {
    const base = obterConfiguracaoGroq();
    const chaveApi = String(sobreposicoes.chaveApi || base.chaveApi || '').trim();
    const urlBase = String(sobreposicoes.urlBase || base.urlBase || URL_BASE_PADRAO).trim().replace(/\/+$/, '');
    const tempoEsgotadoMsBruto = Number(sobreposicoes.tempoEsgotadoMs ?? base.tempoEsgotadoMs);
    const tempoEsgotadoMs = Number.isFinite(tempoEsgotadoMsBruto) ? Math.max(1000, tempoEsgotadoMsBruto) : 15_000;
    return { chaveApi, urlBase, tempoEsgotadoMs };
}
/**
 * Lista os modelos disponíveis para uma determinada chave de API.
 */
export async function listarModelosDisponiveis(chaveApi) {
    const cfg = resolverConfiguracao({ chaveApi });
    if (!cfg.chaveApi)
        return { ok: false, erro: 'CHAVE_API_AUSENTE' };
    try {
        const resposta = await fetch(`${cfg.urlBase}/models`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${cfg.chaveApi}` }
        });
        if (!resposta.ok)
            throw new Error(`ERRO_HTTP_${resposta.status}`);
        const dados = await resposta.json();
        return { ok: true, modelos: dados.data || [] };
    }
    catch (erro) {
        return { ok: false, erro: erro.message };
    }
}
/**
 * Realiza uma conversa (chat) com a IA usando uma chave específica.
 */
export async function groqConversarComChave({ chaveApi, urlBase, tempoEsgotadoMs, mensagens, modelo, temperatura = 0.2, maxTokens } = {}) {
    const cfg = resolverConfiguracao({ chaveApi, urlBase, tempoEsgotadoMs });
    if (!cfg.chaveApi) {
        throw new Error('CHAVE_API_GROQ_AUSENTE');
    }
    const corpo = {
        model: resolverModelo(modelo || obterConfiguracaoModelosGroq().texto),
        messages: Array.isArray(mensagens) ? mensagens : [],
        temperature: Number.isFinite(Number(temperatura)) ? Number(temperatura) : 0.2,
        max_tokens: Number.isFinite(Number(maxTokens)) ? Math.max(1, Number(maxTokens)) : undefined
    };
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), cfg.tempoEsgotadoMs);
    try {
        const resposta = await fetch(`${cfg.urlBase}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${cfg.chaveApi}`
            },
            body: JSON.stringify(corpo),
            signal: controlador.signal
        });
        const textoBruto = await resposta.text();
        let dados = null;
        try {
            dados = textoBruto ? JSON.parse(textoBruto) : null;
        }
        catch {
            dados = null;
        }
        if (!resposta.ok) {
            const erro = new Error('ERRO_API_GROQ');
            erro.status = resposta.status;
            erro.corpo = dados || { bruto: textoBruto };
            throw erro;
        }
        const conteudo = dados?.choices?.[0]?.message?.content;
        return { bruto: dados, conteudo: typeof conteudo === 'string' ? conteudo : '' };
    }
    finally {
        clearTimeout(temporizador);
    }
}
/**
 * Realiza uma conversa (chat) usando a configuração global.
 */
export async function groqConversar(opcoes = {}) {
    const cfg = obterConfiguracaoGroq();
    if (!cfg.chaveApi) {
        throw new Error('CHAVE_API_GROQ_AUSENTE');
    }
    return groqConversarComChave({
        chaveApi: cfg.chaveApi,
        urlBase: cfg.urlBase,
        tempoEsgotadoMs: cfg.tempoEsgotadoMs,
        ...opcoes
    });
}
/**
 * Transcreve um arquivo de áudio usando a API da Groq.
 */
export async function groqTranscreverComChave({ chaveApi, urlBase, tempoEsgotadoMs, bufferArquivo, nomeArquivo, tipoMime, modelo } = {}) {
    const cfg = resolverConfiguracao({ chaveApi, urlBase, tempoEsgotadoMs });
    if (!cfg.chaveApi) {
        throw new Error('CHAVE_API_GROQ_AUSENTE');
    }
    const formulario = new FormData();
    formulario.append('model', String(modelo || obterConfiguracaoModelosGroq().transcrever));
    formulario.append('file', bufferArquivo, {
        filename: String(nomeArquivo || 'audio.bin'),
        contentType: String(tipoMime || 'application/octet-stream')
    });
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), cfg.tempoEsgotadoMs);
    try {
        const resposta = await fetch(`${cfg.urlBase}/audio/transcriptions`, {
            method: 'POST',
            headers: {
                ...formulario.getHeaders(),
                Authorization: `Bearer ${cfg.chaveApi}`
            },
            body: formulario,
            signal: controlador.signal
        });
        const textoBruto = await resposta.text();
        let dados = null;
        try {
            dados = textoBruto ? JSON.parse(textoBruto) : null;
        }
        catch {
            dados = null;
        }
        if (!resposta.ok) {
            const erro = new Error('ERRO_API_GROQ');
            erro.status = resposta.status;
            erro.corpo = dados || { bruto: textoBruto };
            throw erro;
        }
        const transcricao = dados?.text;
        return { bruto: dados, texto: typeof transcricao === 'string' ? transcricao : '' };
    }
    finally {
        clearTimeout(temporizador);
    }
}
