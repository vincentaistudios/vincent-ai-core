/**
 * Comando de Transmissão (Broadcast)
 */
export const executarTransmissao = async (ctx) => {
    const { conexao, origem, argumentos, ehCriador, marca, prefixo, responder, obterListaContatos, obterTipoConteudo, info } = ctx;
    if (!ehCriador) {
        await responder(`${marca} Apenas o criador pode realizar transmissões.`);
        return true;
    }
    const tipo = String(argumentos[0] || '').toLowerCase().trim();
    const texto = argumentos.slice(1).join(' ').trim();
    if (!['contatos', 'grupos', 'todos'].includes(tipo)) {
        await responder(`${marca} Uso correto: ${prefixo}bc <contatos|grupos|todos> <mensagem>`);
        return true;
    }
    const lista = typeof obterListaContatos === 'function' ? obterListaContatos(tipo) : [];
    if (!lista.length) {
        await responder(`${marca} Nenhum destino encontrado para o tipo: *${tipo}*`);
        return true;
    }
    await responder(`${marca} Iniciando transmissão para *${lista.length}* destinos...\n⚠️ Lotes de 5 em 5 com intervalo de 3s.`);
    // Identificação de mídia anexada
    const mensagemCitada = info?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const tipoMidia = mensagemCitada ? obterTipoConteudo(mensagemCitada) : obterTipoConteudo(info.message);
    let conteudoParaEncaminhar = null;
    if (mensagemCitada) {
        conteudoParaEncaminhar = mensagemCitada;
    }
    else if (tipoMidia && tipoMidia !== 'conversation' && tipoMidia !== 'extendedTextMessage') {
        conteudoParaEncaminhar = info.message;
    }
    let totalContatos = 0;
    let totalGrupos = 0;
    for (let i = 0; i < lista.length; i += 5) {
        const lote = lista.slice(i, i + 5);
        for (const jid of lote) {
            try {
                if (conteudoParaEncaminhar) {
                    await conexao.sendMessage(jid, { forward: { key: info.key, message: conteudoParaEncaminhar } });
                }
                else {
                    await conexao.sendMessage(jid, { text: texto || 'Sem mensagem definida.' });
                }
                if (jid.endsWith('@g.us'))
                    totalGrupos++;
                else
                    totalContatos++;
            }
            catch (erro) {
                console.error(`[BC] Erro ao enviar para ${jid}:`, erro);
            }
        }
        if (i + 5 < lista.length) {
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    await responder(`📢 *Transmissão Concluída!*\n\n✅ *Total Enviado:* ${totalContatos + totalGrupos}\n👤 *Contatos:* ${totalContatos}\n👥 *Grupos:* ${totalGrupos}`);
    return true;
};
