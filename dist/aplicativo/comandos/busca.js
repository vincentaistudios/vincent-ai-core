/**
 * Comando de Busca Web (RAG em Tempo Real)
 */
export const executarBuscaWeb = async (ctx) => {
    const { marca, consulta, remetente, groqResponderTexto, responder, prefixo, conexao, origem } = ctx;
    const prompt = String(consulta || '').trim();
    if (!prompt) {
        await responder(`${marca} Uso correto: ${prefixo}s <sua dúvida atual>`);
        return true;
    }
    if (typeof groqResponderTexto !== 'function') {
        await responder(`${marca} Erro: Serviço de IA não carregado.`);
        return true;
    }
    // Sinaliza que o bot está "digitando/pesquisando"
    if (conexao && origem) {
        await conexao.sendPresenceUpdate('composing', origem);
    }
    // Chama a IA com a flag 'usarBusca' ativada
    const resposta = await groqResponderTexto({
        userId: remetente,
        prompt,
        usarBusca: true
    });
    if (!resposta.ok) {
        await responder(`${marca} Erro na busca/IA: ${resposta.error || "Falha desconhecida"}`);
        return true;
    }
    const cabecalho = `🌐 *Resultados da Pesquisa Web:*\n\n`;
    await responder(cabecalho + (resposta.texto || "A IA não conseguiu processar os resultados da busca."));
    return true;
};
