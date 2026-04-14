import { cortarAudio, alterarVelocidade, reverterAudio, bassBoost } from '../../servicos/editor_audio.js';
import { calcular, converter } from '../../servicos/calculadora.js';
import { gerarQRCode, lerQRCode } from '../../servicos/qr_code.js';
import { youtubeMP3, youtubeMP4, tiktokDL, instagramDL, facebookDL, pinterestSearch, buscarLetra } from '../../servicos/downloader_midia.js';
import { enviarSticker } from '../../servicos/gerador_sticker.js';
// ─────────────────────────────────────────────────────────
//  🎵 ÁUDIO
// ─────────────────────────────────────────────────────────
export const executarCorteAudio = async (ctx) => {
    const { consulta, responder, marca, prefixo, obterMidiaReplied } = ctx;
    const args = (consulta || '').trim().split(/\s+/);
    if (args.length < 2) {
        await responder(`${marca} ✂️ Uso: ${prefixo}cortar <inicio> <fim>\n📌 Ex: ${prefixo}cortar 0:10 0:40`);
        return true;
    }
    const bufferAudio = typeof obterMidiaReplied === 'function' ? await obterMidiaReplied('audio') : null;
    if (!bufferAudio) {
        await responder(`${marca} ❌ Responda a um áudio com este comando.`);
        return true;
    }
    const res = await cortarAudio(bufferAudio, args[0], args[1]);
    if (!res.ok) {
        await responder(`${marca} ❌ Falha ao cortar o áudio. Verifique os tempos.`);
        return true;
    }
    await ctx.conexao.sendMessage(ctx.origem, { audio: res.buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: ctx.info });
    await responder(res.mensagem);
    return true;
};
export const executarVelocidadeAudio = async (ctx) => {
    const { consulta, responder, marca, prefixo, obterMidiaReplied } = ctx;
    const vel = parseFloat(consulta || '');
    if (isNaN(vel)) {
        await responder(`${marca} ⏩ Uso: ${prefixo}velocidade <0.5 a 3.0>\n📌 Ex: ${prefixo}velocidade 1.5`);
        return true;
    }
    const bufferAudio = typeof obterMidiaReplied === 'function' ? await obterMidiaReplied('audio') : null;
    if (!bufferAudio) {
        await responder(`${marca} ❌ Responda a um áudio com este comando.`);
        return true;
    }
    const res = await alterarVelocidade(bufferAudio, vel);
    if (!res.ok) {
        await responder(`${marca} ❌ Falha ao alterar velocidade.`);
        return true;
    }
    await ctx.conexao.sendMessage(ctx.origem, { audio: res.buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: ctx.info });
    await responder(res.mensagem);
    return true;
};
export const executarReversoAudio = async (ctx) => {
    const { responder, marca, obterMidiaReplied } = ctx;
    const bufferAudio = typeof obterMidiaReplied === 'function' ? await obterMidiaReplied('audio') : null;
    if (!bufferAudio) {
        await responder(`${marca} ❌ Responda a um áudio com este comando.`);
        return true;
    }
    const res = await reverterAudio(bufferAudio);
    if (!res.ok) {
        await responder(`${marca} ❌ Falha ao reverter o áudio.`);
        return true;
    }
    await ctx.conexao.sendMessage(ctx.origem, { audio: res.buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: ctx.info });
    await responder(res.mensagem);
    return true;
};
export const executarBassBoost = async (ctx) => {
    const { consulta, responder, marca, obterMidiaReplied } = ctx;
    const ganho = parseInt(consulta || '10') || 10;
    const bufferAudio = typeof obterMidiaReplied === 'function' ? await obterMidiaReplied('audio') : null;
    if (!bufferAudio) {
        await responder(`${marca} ❌ Responda a um áudio com este comando.`);
        return true;
    }
    const res = await bassBoost(bufferAudio, ganho);
    if (!res.ok) {
        await responder(`${marca} ❌ Falha ao aplicar bass boost.`);
        return true;
    }
    await ctx.conexao.sendMessage(ctx.origem, { audio: res.buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: ctx.info });
    await responder(res.mensagem);
    return true;
};
// ─────────────────────────────────────────────────────────
//  🧮 CALCULADORA
// ─────────────────────────────────────────────────────────
export const executarCalculadora = async (ctx) => {
    const { consulta, responder, marca, prefixo } = ctx;
    if (!consulta) {
        await responder(`${marca} 🧮 Uso: ${prefixo}calc <expressão>\n📌 Ex: ${prefixo}calc sin(pi/2) + sqrt(16)`);
        return true;
    }
    const res = calcular(consulta);
    await responder(res.mensagem || `${marca} ❌ ${res.erro}`);
    return true;
};
export const executarConversor = async (ctx) => {
    const { consulta, responder, marca, prefixo } = ctx;
    const args = (consulta || '').trim().split(/\s+/);
    if (args.length < 3) {
        await responder(`${marca} 📐 Uso: ${prefixo}converter <valor> <de> <para>\n📌 Ex: ${prefixo}converter 100 km mi`);
        return true;
    }
    const res = converter(parseFloat(args[0]), args[1], args[2]);
    await responder(res.mensagem || `${marca} ❌ ${res.erro}`);
    return true;
};
// ─────────────────────────────────────────────────────────
//  📱 QR CODE
// ─────────────────────────────────────────────────────────
export const executarGerarQR = async (ctx) => {
    const { consulta, responder, marca, prefixo, conexao, origem, info } = ctx;
    if (!consulta) {
        await responder(`${marca} 📱 Uso: ${prefixo}qr <texto ou link>`);
        return true;
    }
    const res = await gerarQRCode(consulta);
    if (!res.ok) {
        await responder(`${marca} ❌ Falha ao gerar o QR Code.`);
        return true;
    }
    await conexao.sendMessage(origem, { image: res.buffer, caption: res.mensagem }, { quoted: info });
    return true;
};
export const executarLerQR = async (ctx) => {
    const { responder, marca, obterMidiaReplied } = ctx;
    const bufferImagem = typeof obterMidiaReplied === 'function' ? await obterMidiaReplied('image') : null;
    if (!bufferImagem) {
        await responder(`${marca} ❌ Responda a uma imagem com QR Code para lê-lo.`);
        return true;
    }
    const res = await lerQRCode(bufferImagem);
    await responder(res.mensagem || `${marca} ❌ Nenhum QR Code encontrado na imagem.`);
    return true;
};
// ─────────────────────────────────────────────────────────
//  📥 DOWNLOADS
// ─────────────────────────────────────────────────────────
export const executarYoutubeMP3 = async (ctx) => {
    const { consulta, responder, marca, prefixo, conexao, origem, info } = ctx;
    if (!consulta) {
        await responder(`${marca} 🎵 Uso: ${prefixo}ytmp3 <url ou nome da música>`);
        return true;
    }
    await responder(`${marca} 🔍 Buscando e baixando áudio...`);
    const res = await youtubeMP3(consulta);
    if (!res.ok) {
        await responder(res.mensagem || `${marca} ❌ Falha ao baixar o áudio.`);
        return true;
    }
    await conexao.sendMessage(origem, { audio: res.buffer, mimetype: 'audio/mpeg', fileName: `${res.titulo}.mp3` }, { quoted: info });
    return true;
};
export const executarYoutubeMP4 = async (ctx) => {
    const { consulta, responder, marca, prefixo, conexao, origem, info } = ctx;
    if (!consulta) {
        await responder(`${marca} 🎬 Uso: ${prefixo}ytmp4 <url do vídeo>`);
        return true;
    }
    await responder(`${marca} 🔍 Buscando e baixando vídeo...`);
    const res = await youtubeMP4(consulta);
    if (!res.ok) {
        await responder(res.mensagem || `${marca} ❌ Falha ao baixar o vídeo.`);
        return true;
    }
    await conexao.sendMessage(origem, { video: res.buffer, caption: res.titulo }, { quoted: info });
    return true;
};
export const executarTiktokDL = async (ctx) => {
    const { consulta, responder, marca, prefixo, conexao, origem, info } = ctx;
    if (!consulta) {
        await responder(`${marca} 📱 Uso: ${prefixo}tiktok <url>`);
        return true;
    }
    await responder(`${marca} 🔍 Baixando vídeo do TikTok...`);
    const res = await tiktokDL(consulta);
    if (!res.ok) {
        await responder(res.mensagem || `${marca} ❌ Falha ao baixar.`);
        return true;
    }
    await conexao.sendMessage(origem, { video: res.buffer, caption: res.titulo }, { quoted: info });
    return true;
};
export const executarInstagramDL = async (ctx) => {
    const { consulta, responder, marca, prefixo, conexao, origem, info } = ctx;
    if (!consulta) {
        await responder(`${marca} 📸 Uso: ${prefixo}ig <url>`);
        return true;
    }
    await responder(`${marca} 🔍 Baixando do Instagram...`);
    const res = await instagramDL(consulta);
    if (!res.ok) {
        await responder(res.mensagem || `${marca} ❌ Falha ao baixar.`);
        return true;
    }
    await conexao.sendMessage(origem, { video: res.buffer }, { quoted: info });
    return true;
};
export const executarFacebookDL = async (ctx) => {
    const { consulta, responder, marca, prefixo, conexao, origem, info } = ctx;
    if (!consulta) {
        await responder(`${marca} 📘 Uso: ${prefixo}fb <url>`);
        return true;
    }
    await responder(`${marca} 🔍 Baixando do Facebook...`);
    const res = await facebookDL(consulta);
    if (!res.ok) {
        await responder(res.mensagem || `${marca} ❌ Falha ao baixar.`);
        return true;
    }
    await conexao.sendMessage(origem, { video: res.buffer }, { quoted: info });
    return true;
};
export const executarPinterest = async (ctx) => {
    const { consulta, responder, marca, prefixo, conexao, origem, info } = ctx;
    if (!consulta) {
        await responder(`${marca} 📌 Uso: ${prefixo}pin <termo>`);
        return true;
    }
    const res = await pinterestSearch(consulta);
    if (!res.ok || !res.data?.results?.[0]) {
        await responder(`${marca} ❌ Nenhuma imagem encontrada.`);
        return true;
    }
    const imgUrl = res.data.results[0].directLink || res.data.results[0].image;
    await conexao.sendMessage(origem, { image: { url: imgUrl }, caption: `${marca} 📌 Pinterest: ${consulta}` }, { quoted: info });
    return true;
};
export const executarLyrics = async (ctx) => {
    const { consulta, responder, marca, prefixo } = ctx;
    if (!consulta) {
        await responder(`${marca} 📜 Uso: ${prefixo}letra <nome da musica>`);
        return true;
    }
    const res = await buscarLetra(consulta);
    if (!res.ok || !res.data?.results?.resultados?.[0]) {
        await responder(`${marca} ❌ Letra não encontrada.`);
        return true;
    }
    const m = res.data.results.resultados[0];
    const texto = `📜 *${m.txt}*\n👤 ${m.art}\n\n${m.lyrics}`;
    await responder(texto);
    return true;
};
export const executarSticker = async (ctx) => {
    const { responder, marca, obterMidiaReplied, conexao, origem, info } = ctx;
    const buffer = typeof obterMidiaReplied === 'function' ? await obterMidiaReplied('image') || await obterMidiaReplied('video') : null;
    if (!buffer) {
        await responder(`${marca} ❌ Responda a uma imagem ou vídeo para criar um sticker.`);
        return true;
    }
    await responder(`${marca} 🎨 Criando seu sticker...`);
    try {
        await enviarSticker(conexao, origem, { sticker: buffer, tipo: ctx.info.message?.videoMessage ? 'video' : 'image' }, { quoted: info });
    }
    catch (e) {
        await responder(`${marca} ❌ Falha ao criar sticker.`);
    }
    return true;
};
