import { FuncaoComando } from './tipos.js';

/**
 * Comando de Gerenciamento de Grupo
 */
export const executarGrupo: FuncaoComando = async (ctx) => {
  const { 
    conexao, origem, argumentos, ehGrupo, ehCriador, ehAdmins, ehBotAdmins, 
    marca, prefixo, responder, metadadosGrupo, downloadContentFromMessage 
  } = ctx;

  if (!ehGrupo) {
    await responder(`${marca} Este comando só pode ser usado dentro de grupos.`);
    return true;
  }

  if (!ehAdmins && !ehCriador) {
    await responder(`${marca} Apenas administradores ou o criador do bot podem gerenciar o grupo.`);
    return true;
  }

  if (!ehBotAdmins) {
    await responder(`${marca} Eu preciso ser administrador do grupo para realizar estas ações.`);
    return true;
  }

  const acao = String(argumentos[0] || '').toLowerCase().trim();
  const texto = argumentos.slice(1).join(' ').trim();

  switch (acao) {
    case 'nome': {
      if (!texto) return responder(`${marca} Forneça o novo nome: ${prefixo}grupo nome <texto>`);
      const antigo = metadadosGrupo?.subject || 'Indefinido';
      await conexao.groupUpdateSubject(origem, texto);
      await responder(`✅ *Nome do Grupo Alterado!*\n\n*Antigo:* ${antigo}\n*Novo:* ${texto}`);
      return true;
    }
    case 'desc': {
      const antigo = metadadosGrupo?.desc || 'Sem descrição';
      await conexao.groupUpdateDescription(origem, texto || "");
      await responder(`✅ *Descrição Alterada!*\n\n*Antigo:* ${antigo}\n*Novo:* ${texto || 'Vazia'}`);
      return true;
    }
    case 'foto': {
      const infoMensagem = ctx.info;
      const isQuotedImage = infoMensagem?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const isImage = infoMensagem?.message?.imageMessage;

      if (!isImage && !isQuotedImage) {
          return responder(`${marca} Marque ou envie uma imagem com ${prefixo}grupo foto`);
      }
      
      const msgMidia = isQuotedImage ? infoMensagem.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage : infoMensagem.message.imageMessage;
      const stream = await downloadContentFromMessage(msgMidia, 'image');
      
      let buffer = Buffer.from([]);
      for await (const chunk of stream) { 
          buffer = Buffer.concat([buffer, chunk]); 
      }
      
      await conexao.updateProfilePicture(origem, buffer);
      await responder(`✅ *Foto do grupo atualizada com sucesso!*`);
      return true;
    }
    case 'promover': {
      const usuarios = ctx.info?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!usuarios.length) return responder(`${marca} Marque os usuários que deseja promover.`);
      await conexao.groupParticipantsUpdate(origem, usuarios, 'promote');
      await responder(`✅ *Usuários promovidos.*`);
      return true;
    }
    case 'rebaixar': {
      const usuarios = ctx.info?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!usuarios.length) return responder(`${marca} Marque os usuários que deseja rebaixar.`);
      await conexao.groupParticipantsUpdate(origem, usuarios, 'demote');
      await responder(`✅ *Usuários rebaixados.*`);
      return true;
    }
    case 'fechar': {
      await conexao.groupSettingUpdate(origem, 'announcement');
      await responder(`✅ *Grupo fechado!* Apenas administradores podem enviar mensagens.`);
      return true;
    }
    case 'abrir': {
      await conexao.groupSettingUpdate(origem, 'not_announcement');
      await responder(`✅ *Grupo aberto!* Todos os membros podem enviar mensagens.`);
      return true;
    }
    default: {
      await responder(
        `*Gerenciamento de Grupo*\n\n` +
        `- ${prefixo}grupo nome <texto>\n` +
        `- ${prefixo}grupo desc <texto>\n` +
        `- ${prefixo}grupo foto (marque uma imagem)\n` +
        `- ${prefixo}grupo promover @usuario\n` +
        `- ${prefixo}grupo rebaixar @usuario\n` +
        `- ${prefixo}grupo fechar/abrir`
      );
      return true;
    }
  }
};
