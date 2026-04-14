// Importação dos comandos individuais traduzidos
import { executarMenu } from './comandos/menu.js';
import { executarStatus, executarIA } from './comandos/ia_status.js';
import { executarGrupo } from './comandos/grupo.js';
import { executarTransmissao } from './comandos/transmissao.js';
import { executarTesteSeco, executarIAAutomatica, executarModoIA } from './comandos/configuracoes.js';
import { executarPainel, lidarComAcaoPainel } from './comandos/painel.js';
import { executarBuscaWeb } from './comandos/busca.js';
import { executarCorteAudio, executarVelocidadeAudio, executarReversoAudio, executarBassBoost, executarCalculadora, executarConversor, executarGerarQR, executarLerQR, executarYoutubeMP3, executarYoutubeMP4, executarTiktokDL, executarInstagramDL, executarFacebookDL, executarPinterest, executarLyrics, executarSticker, } from './comandos/ferramentas.js';
/**
 * Função principal que recebe mensagens de comando e despacha para a lógica correta.
 */
export async function lidarComComando(ctx) {
    const { comando, responder, marca, prefixo } = ctx;
    switch (comando) {
        // ── Navegação ──────────────────────────────────────────────
        case 'menu':
        case 'ajuda':
        case 'help':
            return await executarMenu(ctx);
        // ── IA & Chat ──────────────────────────────────────────────
        case 'ia':
        case 'chat':
            return await executarIA(ctx);
        case 's':
        case 'buscar':
        case 'google':
            return await executarBuscaWeb(ctx);
        case 'iamodo':
        case 'iamodelo':
            return await executarModoIA(ctx);
        case 'autoai':
        case 'aiauto':
            return await executarIAAutomatica(ctx);
        // ── 🎵 Áudio ──────────────────────────────────────────────
        case 'cortar':
        case 'cut':
            return await executarCorteAudio(ctx);
        case 'velocidade':
        case 'speed':
            return await executarVelocidadeAudio(ctx);
        case 'reverso':
        case 'reverse':
        case 'reverter':
            return await executarReversoAudio(ctx);
        case 'bass':
        case 'bassboost':
            return await executarBassBoost(ctx);
        // ── 🧮 Utilitários ─────────────────────────────────────────
        case 'calc':
        case 'calcular':
        case 'calculadora':
            return await executarCalculadora(ctx);
        case 'converter':
        case 'conv':
            return await executarConversor(ctx);
        case 'qr':
        case 'qrcode':
        case 'gerarqr':
            return await executarGerarQR(ctx);
        case 'lerqr':
        case 'readqr':
        case 'scanqr':
            return await executarLerQR(ctx);
        // ── 📥 Downloads ───────────────────────────────────────────
        case 'ytmp3':
        case 'mp3':
        case 'musica':
            return await executarYoutubeMP3(ctx);
        case 'ytmp4':
        case 'mp4':
        case 'video':
            return await executarYoutubeMP4(ctx);
        case 'tiktok':
        case 'tt':
            return await executarTiktokDL(ctx);
        case 'ig':
        case 'instagram':
        case 'insta':
            return await executarInstagramDL(ctx);
        case 'fb':
        case 'facebook':
            return await executarFacebookDL(ctx);
        case 'pin':
        case 'pinterest':
            return await executarPinterest(ctx);
        case 'letra':
        case 'lyrics':
            return await executarLyrics(ctx);
        case 'sticker':
        case 'st':
            return await executarSticker(ctx);
        // ── 👥 Grupos ──────────────────────────────────────────────
        case 'grupo':
            return await executarGrupo(ctx);
        case 'bc':
        case 'transmissao':
        case 'broadcast':
            return await executarTransmissao(ctx);
        // ── 📊 Status & Sistema ────────────────────────────────────
        case 'status':
        case 'info':
            return await executarStatus(ctx);
        case 'dryrun':
        case 'testeseco':
            return await executarTesteSeco(ctx);
        // ── 👑 Área do Dono ────────────────────────────────────────
        case 'painel':
            return await executarPainel(ctx);
        case 'painel_reiniciar':
        case 'painel_limpar':
            return await lidarComAcaoPainel(ctx);
        // ── Atalhos de menu ────────────────────────────────────────
        case 'menu_img':
            await responder(`${marca} 🎨 Digite o que deseja que eu desenhe (ex: um robô em Marte).`);
            return true;
        case 'menu_modo':
            await responder(`${marca} Use *${prefixo}iamodo <rápido|inteligente>* para alterar o motor de IA.`);
            return true;
        default:
            return false;
    }
}
