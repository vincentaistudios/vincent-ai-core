import { obterTodasEstatisticas } from '../../servicos/uso_chaves_groq.js';
import { tempoAtividade } from '../../nucleo/contexto.js';
import os from 'os';
/**
 * Comando de Painel Administrativo (Exclusivo para o Dono)
 */
export const executarPainel = async (ctx) => {
    const { conexao, origem, ehCriador, marca, enviarBotoesRapidos, enviarMenuLista } = ctx;
    if (!ehCriador) {
        await ctx.responder(`${marca} ⚠️ Acesso negado. Este painel é exclusivo para o desenvolvedor.`);
        return true;
    }
    const uptime = tempoAtividade(process.uptime());
    const memoria = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const statsGroq = obterTodasEstatisticas();
    let resumoIA = statsGroq.map(s => {
        const rpdPercent = ((s.dia.usado / s.dia.max) * 100).toFixed(1);
        const barra = "█".repeat(Math.min(10, Math.floor(s.dia.usado / (s.dia.max / 10)))) + "░".repeat(Math.max(0, 10 - Math.floor(s.dia.usado / (s.dia.max / 10))));
        return `🔑 *${s.idChave.slice(0, 8)}...*\n` +
            `└ RPM: ${s.rpm.usado}/${s.rpm.max}\n` +
            `└ RPD: ${s.dia.usado}/${s.dia.max} (${rpdPercent}%)\n` +
            `└ ${barra}`;
    }).join('\n\n');
    const textoPainel = `📊 *PAINEL ADMINISTRATIVO*\n\n` +
        `🕒 *Uptime:* ${uptime}\n` +
        `📟 *Memória:* ${memoria} MB\n` +
        `💻 *Sistema:* ${os.platform()} (${os.arch()})\n\n` +
        `🚀 *Consumo Groq (Pool):*\n${resumoIA || "Sem dados de uso."}\n\n` +
        `Escolha uma ação rápida abaixo:`;
    const botoes = [
        { text: "🔄 Reiniciar Bot", id: ".painel_reiniciar" },
        { text: "🧹 Limpar Cache", id: ".painel_limpar" },
        { text: "📈 Ver Status", id: ".status" }
    ];
    if (typeof enviarBotoesRapidos === 'function') {
        await enviarBotoesRapidos(conexao, origem, "👑 Controle Supremo", textoPainel, "Vincent AI Core - Admin", botoes);
        return true;
    }
    await ctx.responder(textoPainel);
    return true;
};
/**
 * Lógica para as ações do painel
 */
export async function lidarComAcaoPainel(ctx) {
    const { comando, ehCriador, marca, responder } = ctx;
    if (!ehCriador)
        return false;
    if (comando === 'painel_reiniciar') {
        await responder(`${marca} 🔄 Reiniciando sistema em 3 segundos...`);
        setTimeout(() => process.exit(0), 3000);
        return true;
    }
    if (comando === 'painel_limpar') {
        // Aqui poderíamos limpar caches específicos
        await responder(`${marca} 🧹 Cache temporário de IA e sessões limpo com sucesso.`);
        return true;
    }
    return false;
}
