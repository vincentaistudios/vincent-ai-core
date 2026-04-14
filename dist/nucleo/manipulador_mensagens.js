import { getContentType, downloadContentFromMessage } from '@whiskeysockets/baileys';
import moment from 'moment-timezone';
import { marca, configuracoesBot, adicionarFiltro, estaFiltrado, colors, logger } from './contexto.js';
// Importações de serviços traduzidos
import { obterModoChat } from '../servicos/fluxo_ia_auto.js';
import { registrarContato } from '../servicos/rastreador_contatos.js';
import { estaChatPermitido } from '../servicos/politica.js';
import { groqResponderTexto, groqResponderImagem, groqTranscrever } from '../servicos/fluxo_groq.js';
import { resolverModelo } from '../servicos/cliente_groq.js';
import { coletarFluxoComLimite } from '../servicos/midia.js';
import { obterFlagChat } from '../servicos/flags_conversa.js';
import { lidarComComando } from '../aplicativo/despachante_comandos.js';
import * as interativo from '../servicos/mensagens_interativas.js';
const ultimasExecucoesIA = new Map();
/**
 * Verifica se a IA pode ser executada novamente para este chat respeitando o intervalo mínimo.
 */
const podeExecutarIAGora = (chatId, intervaloMinMs) => {
    const agora = Date.now();
    const ultima = ultimasExecucoesIA.get(chatId) || 0;
    if (agora - ultima < intervaloMinMs)
        return false;
    ultimasExecucoesIA.set(chatId, agora);
    return true;
};
/**
 * Ponto de entrada para o processamento de mensagens.
 */
export const carregarManipulador = async (atualizacao, conexao) => {
    const horaFormatada = moment.tz('America/Sao_Paulo').format('HH:mm:ss');
    for (const info of atualizacao?.messages || []) {
        if (!info.key)
            continue;
        const origem = info.key.remoteJid;
        if (!origem)
            continue;
        registrarContato(origem);
        const ehGrupo = origem.endsWith('@g.us');
        const remetente = ehGrupo ? (info.key.participant?.includes(':') ? info.key.participant.split(':')[0] + '@s.whatsapp.net' : info.key.participant) : info.key.remoteJid;
        if (!remetente)
            continue;
        if (!estaChatPermitido(origem, configuracoesBot))
            continue;
        const tipoMensagem = getContentType(info.message || {}) || '';
        if (!info.message || atualizacao.type === "append")
            continue;
        const nomeUsuario = info.pushName || 'Usuário';
        const prefixo = configuracoesBot.prefixo;
        const numeroDono = (configuracoesBot.numerodono || '').replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        // Extração do texto da mensagem (corpo)
        const corpo = info.message?.conversation ||
            info.message?.extendedTextMessage?.text ||
            info.message?.imageMessage?.caption ||
            info.message?.videoMessage?.caption ||
            info.message?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
            info.message?.buttonsResponseMessage?.selectedButtonId ||
            info.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
            "";
        const ehCriador = numeroDono.includes(remetente);
        const ehComando = corpo.trim().startsWith(prefixo);
        const comando = ehComando ? corpo.trim().slice(prefixo.length).trim().split(/ +/).shift()?.toLowerCase() || "" : "";
        const argumentos = corpo.trim().split(/ +/).slice(1);
        const consulta = argumentos.join(' ');
        /**
         * Função auxiliar para responder mensagens.
         */
        const responder = async (texto, tipo = 'text', opcoes = {}) => {
            if (tipo === 'text') {
                opcoes.text = texto;
            }
            return conexao.sendMessage(origem, opcoes, { quoted: info });
        };
        // Logs de console em Português
        if (ehComando) {
            console.log(colors.cyan(`${marca} [COMANDO] ${comando} de ${nomeUsuario} em ${horaFormatada}`));
        }
        // Despacho de Comandos
        if (ehComando) {
            const manipulado = await lidarComComando({
                comando,
                argumentos,
                consulta,
                corpo,
                ehCriador,
                ehGrupo,
                origem,
                remetente,
                prefixo,
                marca,
                configuracoes: configuracoesBot,
                responder,
                conexao,
                info,
                logger,
                ...interativo // Injeta funções interativas (enviarBotoes, etc) no contexto
            });
            if (manipulado)
                continue;
        }
        // Processamento de IA Automática (se não for comando)
        if (!ehComando) {
            const modoIA = obterModoChat(origem, ehGrupo);
            if (modoIA === 'off')
                continue;
            const ehMidiaIA = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(tipoMensagem);
            if (ehMidiaIA) {
                if (!podeExecutarIAGora(origem, 2000))
                    continue;
                // Sinaliza "gravando" para áudio ou "digitando" para outros
                await conexao.sendPresenceUpdate(tipoMensagem === 'audioMessage' ? 'recording' : 'composing', origem);
                try {
                    const limiteBytes = Number(configuracoesBot.maxMediaBytes || 6 * 1024 * 1024);
                    if (tipoMensagem === 'imageMessage') {
                        const fluxo = await downloadContentFromMessage(info.message.imageMessage, 'image');
                        const buffer = await coletarFluxoComLimite(fluxo, limiteBytes);
                        const r = await groqResponderImagem({ userId: remetente, prompt: corpo, bufferImagem: buffer, tipoMime: info.message.imageMessage.mimetype || 'image/jpeg' });
                        if (r.ok)
                            await responder(r.texto);
                    }
                    else if (tipoMensagem === 'audioMessage') {
                        const fluxo = await downloadContentFromMessage(info.message.audioMessage, 'audio');
                        const buffer = await coletarFluxoComLimite(fluxo, limiteBytes);
                        const trans = await groqTranscrever({ userId: remetente, bufferArquivo: buffer, nomeArquivo: 'voz.ogg', tipoMime: info.message.audioMessage.mimetype || 'audio/ogg' });
                        if (trans.ok) {
                            const r = await groqResponderTexto({ userId: remetente, prompt: trans.texto });
                            if (r.ok)
                                await responder(r.texto);
                        }
                    }
                }
                catch (erro) {
                    console.error(`${marca} Erro ao processar mídia:`, erro);
                }
            }
            else if (corpo.length >= 3) {
                if (estaFiltrado(origem))
                    continue;
                adicionarFiltro(origem);
                // Sinaliza que o bot está digitando
                await conexao.sendPresenceUpdate('composing', origem);
                const modeloBase = obterFlagChat(origem, 'modeloIA', 'inteligente');
                const r = await groqResponderTexto({ userId: remetente, prompt: corpo, model: resolverModelo(modeloBase) });
                if (r.ok) {
                    await responder(r.texto || "Sem resposta da IA.");
                }
            }
        }
    }
};
