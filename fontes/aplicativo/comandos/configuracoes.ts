import { FuncaoComando } from './tipos.js';

/**
 * Comando de Teste Seco (Dry-run) - Impede que o bot envie mensagens reais (apenas simula).
 */
export const executarTesteSeco: FuncaoComando = async (ctx) => {
  const { ehCriador, argumentos, origem, obterFlagChat, definirFlagChat, responder, marca, prefixo } = ctx;
  
  if (!ehCriador) {
    await responder(`${marca} Apenas o criador pode alterar este modo.`);
    return true;
  }
  
  const acao = String(argumentos[0] || '').toLowerCase().trim();
  
  if (!acao || acao === 'status') {
    const valor = typeof obterFlagChat === 'function' ? obterFlagChat(origem, 'dryRun', false) : false;
    await responder(`${marca} Teste seco (Dry-run) neste chat: ${valor ? 'on' : 'off'}`);
    return true;
  }
  
  if (acao === 'on' || acao === 'off') {
    if (typeof definirFlagChat === 'function') {
      definirFlagChat(origem, 'dryRun', acao === 'on');
      await responder(`${marca} Teste seco atualizado para: ${acao}`);
      return true;
    }
  }
  
  await responder(`${marca} Uso: ${prefixo}dryrun on | off | status`);
  return true;
};

/**
 * Comando de IA Automática - Liga/Desliga a IA para mensagens que não são comandos.
 */
export const executarIAAutomatica: FuncaoComando = async (ctx) => {
  const { ehCriador, argumentos, origem, ehGrupo, obterModoChat, definirModoChat, responder, marca, prefixo } = ctx;
  
  if (!ehCriador) {
    await responder(`${marca} Apenas o criador pode alterar este modo.`);
    return true;
  }
  
  const acao = String(argumentos[0] || '').toLowerCase().trim();
  
  if (!acao || acao === 'status') {
    const modo = typeof obterModoChat === 'function' ? obterModoChat(origem, ehGrupo) : 'desconhecido';
    await responder(`${marca} Modo IA automática deste chat: ${modo}`);
    return true;
  }
  
  if (acao === 'on' || acao === 'off' || acao === 'trigger') {
    if (typeof definirModoChat === 'function') {
      definirModoChat(origem, acao);
      await responder(`${marca} Modo IA automática atualizado para: ${acao}`);
      return true;
    }
  }
  
  await responder(`${marca} Uso: ${prefixo}autoai on | off | trigger | status`);
  return true;
};

/**
 * Comando de Modo/Modelo IA - Altera o modelo da Groq usado no chat.
 */
export const executarModoIA: FuncaoComando = async (ctx) => {
  const { ehCriador, argumentos, origem, configuracoes, obterFlagChat, definirFlagChat, resolverModelo, responder, marca, prefixo } = ctx;
  
  if (!ehCriador) {
    await responder(`${marca} Apenas o criador pode alterar o modelo global.`);
    return true;
  }
  
  const apelido = String(argumentos[0] || '').toLowerCase().trim();
  
  if (!apelido) {
    const atual = typeof obterFlagChat === 'function' ? obterFlagChat(origem, 'modeloIA', configuracoes.GROQ_MODEL_TEXT || 'inteligente') : 'padrão';
    await responder(`${marca} Modelo atual deste chat: *${atual}*\nUse: ${prefixo}iamodo <apelido ou id>\nEx: ${prefixo}iamodo rápido`);
    return true;
  }
  
  const idReal = typeof resolverModelo === 'function' ? resolverModelo(apelido) : apelido;
  if (typeof definirFlagChat === 'function') {
    definirFlagChat(origem, 'modeloIA', apelido);
    await responder(`${marca} Modelo alterado para: *${apelido}* (${idReal})`);
    return true;
  }
  
  return false;
};
