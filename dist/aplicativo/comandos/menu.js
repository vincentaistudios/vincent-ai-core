import { menu } from '../../menus/menu.js';
/**
 * Comando de Menu Principal (Interativo)
 */
export const executarMenu = async (ctx) => {
    const { conexao, origem, configuracoes, enviarMenuLista, nomeBot } = ctx;
    const botName = configuracoes.nickbot || nomeBot;
    // Obtém a estrutura interativa traduzida do diretório de menus
    const dadosMenu = menu({
        prefix: configuracoes.prefixo,
        botName
    });
    if (typeof enviarMenuLista === 'function') {
        try {
            await enviarMenuLista(conexao, origem, dadosMenu.texto, dadosMenu.tituloBotao, dadosMenu.secoes);
            return true;
        }
        catch {
            // Falhou em enviar interativo, cai no fallback de texto
        }
    }
    // Fallback: Menu em formato de texto
    let menuTexto = `👋 Olá! Eu sou o *${botName || nomeBot}*.\n\n`;
    menuTexto += `Comandos ativos (prefixo: *${configuracoes.prefixo}*):\n\n`;
    for (const secao of dadosMenu.secoes) {
        menuTexto += `*══ [ ${secao.title} ] ══*\n`;
        for (const row of secao.rows) {
            menuTexto += `• *${row.title}*: ${row.description}\n`;
        }
        menuTexto += `\n`;
    }
    menuTexto += `\n_${dadosMenu.rodape}_`;
    await ctx.responder(menuTexto);
    return true;
};
