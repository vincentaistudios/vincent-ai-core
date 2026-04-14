import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
/**
 * Envia botões de resposta rápida (Quick Reply).
 */
export async function enviarBotoesRapidos(conexao, jid, titulo, texto, rodape, botoesArray) {
    const botoesFormatados = botoesArray.map(btn => ({
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
            display_text: btn.text,
            id: btn.id
        })
    }));
    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text: texto }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: rodape }),
                    header: proto.Message.InteractiveMessage.Header.create({ title: titulo, subtitle: "", hasMediaAttachment: false }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: botoesFormatados
                    })
                })
            }
        }
    }, { userJid: conexao.user?.id || '' });
    if (msg.message && msg.key.id) {
        await conexao.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }
}
/**
 * Envia botões de ação (URL, Cópia de Texto/PIX).
 */
export async function enviarBotoesDeAcao(conexao, jid, texto, urlSite, textoCopia) {
    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text: texto }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: "Vincent AI Studios" }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            {
                                name: "cta_url",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "🌐 Visitar Site",
                                    url: urlSite
                                })
                            },
                            {
                                name: "cta_copy",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "📋 Copiar Código",
                                    id: "copy_code",
                                    copy_code: textoCopia
                                })
                            }
                        ]
                    })
                })
            }
        }
    }, { userJid: conexao.user?.id || '' });
    if (msg.message && msg.key.id) {
        await conexao.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }
}
/**
 * Envia menu de lista (Single Select).
 */
export async function enviarMenuLista(conexao, jid, textoPrincipal, tituloBotao, secoes) {
    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text: textoPrincipal }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: "Selecione uma opção abaixo" }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: JSON.stringify({
                                    title: tituloBotao || "Abrir Menu",
                                    sections: secoes
                                })
                            }
                        ]
                    })
                })
            }
        }
    }, { userJid: conexao.user?.id || '' });
    if (msg.message && msg.key.id) {
        await conexao.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }
}
/**
 * Envia carrossel de cards.
 */
export async function enviarCarrossel(conexao, jid, textoCorpo, cardsArray) {
    const cards = cardsArray.map(card => {
        return {
            header: proto.Message.InteractiveMessage.Header.create({ title: card.titulo, subtitle: card.subtitulo || "", hasMediaAttachment: false }),
            body: proto.Message.InteractiveMessage.Body.create({ text: card.texto }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: (card.botoes || []).map((btn) => ({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({ display_text: btn.text, id: btn.id })
                }))
            })
        };
    });
    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text: textoCorpo }),
                    carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
                        cards: cards.map(card => proto.Message.InteractiveMessage.create(card))
                    })
                })
            }
        }
    }, { userJid: conexao.user?.id || '' });
    if (msg.message && msg.key.id) {
        await conexao.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }
}
/**
 * Envia enquete nativa.
 */
export async function enviarEnquete(conexao, jid, nome, valores, multiplasEscolhas = false) {
    await conexao.sendMessage(jid, {
        poll: {
            name: nome,
            values: valores,
            selectableCount: multiplasEscolhas ? valores.length : 1
        }
    });
}
/**
 * Envia cartão de contato (VCard).
 */
export async function enviarContatoCard(conexao, jid, nomeContato, numeroContato) {
    const vcard = 'BEGIN:VCARD\n'
        + 'VERSION:3.0\n'
        + `FN:${nomeContato}\n`
        + `TEL;type=CELL;type=VOICE;waid=${numeroContato}:+${numeroContato}\n`
        + 'END:VCARD';
    await conexao.sendMessage(jid, {
        contacts: {
            displayName: nomeContato,
            contacts: [{ vcard }]
        }
    });
}
/**
 * Solicita localização do usuário.
 */
export async function solicitarLocalizacao(conexao, jid, texto) {
    const msg = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text: texto }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: "Segurança e privacidade garantidas" }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [{ name: "send_location", buttonParamsJson: "" }]
                    })
                })
            }
        }
    }, { userJid: conexao.user?.id || '' });
    if (msg.message && msg.key.id) {
        await conexao.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }
}
