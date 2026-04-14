/**
 * Comando de Status do Sistema
 */
export const executarStatus = async (ctx) => {
    const { marca, origem, ehGrupo, obterPoolChavesGroq, obterTodasEstatisticas, obterModoChat, obterFlagChat, responder } = ctx;
    const pool = typeof obterPoolChavesGroq === 'function' ? obterPoolChavesGroq() : [];
    const estatisticas = typeof obterTodasEstatisticas === 'function' ? obterTodasEstatisticas() : [];
    const totalChaves = pool.length;
    const chavesRastreadas = estatisticas.length;
    const modo = typeof obterModoChat === 'function' ? obterModoChat(origem, ehGrupo) : 'desconhecido';
    const testeSeco = typeof obterFlagChat === 'function' ? obterFlagChat(origem, 'dryRun', false) : false;
    const linhas = [
        `${marca} *STATUS DO SISTEMA*`,
        ``,
        `📍 *Chat atual:* ${origem}`,
        `🤖 *IA Automática:* ${modo.toUpperCase()}`,
        `🧪 *Modo Simulação:* ${testeSeco ? 'Ativado' : 'Desativado'}`,
        ``,
        `🔑 *Chaves Groq (Pool):* ${totalChaves}`,
        `📊 *Chaves Ativas:* ${chavesRastreadas}`,
        `⏱️ Limite padrão por chave: 20 RPM / 1000 RPD`,
        ``,
        `💻 Painel de controle: http://127.0.0.1:3099/`
    ];
    await responder(linhas.join('\n'));
    return true;
};
/**
 * Comando de Inteligência Artificial (Prompt Direto)
 */
export const executarIA = async (ctx) => {
    const { marca, consulta, corpo, remetente, groqResponderTexto, responder, prefixo } = ctx;
    const prompt = String(consulta || '').trim() || String(corpo || '').trim();
    if (!prompt) {
        await responder(`${marca} Uso correto: ${prefixo}ia <seu texto>`);
        return true;
    }
    if (typeof groqResponderTexto !== 'function') {
        await responder(`${marca} Erro: Serviço de IA não carregado.`);
        return true;
    }
    const resposta = await groqResponderTexto({ userId: remetente, prompt });
    if (!resposta.ok) {
        if (resposta.error === 'no_keys') {
            await responder(`${marca} Nenhuma chave Groq configurada no servidor.`);
            return true;
        }
        await responder(`${marca} Erro na IA: ${resposta.error}`);
        return true;
    }
    await responder(resposta.text || `${marca} A IA não retornou conteúdo.`);
    return true;
};
