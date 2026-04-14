import { nomeBot, configuracoesBot } from '../nucleo/configuracao.js';

/**
 * Gera a estrutura de menu interativo (Lista) para o bot.
 */
export function menu({ 
  prefix = configuracoesBot.prefixo, 
  botName = nomeBot 
} = {}) {
  const p = String(prefix);
  const name = String(botName);

  const textoPrincipal = `👋 Olá! Eu sou o *${name}*.\n\nEscolha uma das categorias abaixo:`;
  const tituloBotao = "📑 Abrir Menu";

  const secoes = [
    {
      title: "🤖 Inteligência Artificial",
      rows: [
        { title: `${p}ia`, description: "Conversa livre com a IA (texto)", id: `${p}ia` },
        { title: `${p}s`, description: "Busca na internet em tempo real", id: `${p}s` },
        { title: `${p}iamodo`, description: "Trocar modo (inteligente/rápido)", id: `${p}iamodo` },
      ]
    },
    {
      title: "🎵 Áudio",
      rows: [
        { title: `${p}cortar`, description: "Cortar um trecho do áudio", id: `${p}cortar` },
        { title: `${p}velocidade`, description: "Alterar velocidade do áudio (0.5x–3x)", id: `${p}velocidade` },
        { title: `${p}reverso`, description: "Tocar o áudio ao contrário", id: `${p}reverso` },
        { title: `${p}bass`, description: "Aplicar bass boost no áudio", id: `${p}bass` },
      ]
    },
    {
      title: "🧮 Utilitários",
      rows: [
        { title: `${p}calc`, description: "Calculadora científica", id: `${p}calc` },
        { title: `${p}converter`, description: "Converter unidades (km, °C, kg...)", id: `${p}converter` },
        { title: `${p}qr`, description: "Gerar QR Code a partir de texto", id: `${p}qr` },
        { title: `${p}lerqr`, description: "Ler QR Code de uma imagem", id: `${p}lerqr` },
      ]
    },
    {
      title: "📥 Downloads",
      rows: [
        { title: `${p}ytmp3`, description: "Baixar áudio do YouTube (MP3)", id: `${p}ytmp3` },
        { title: `${p}ytmp4`, description: "Baixar vídeo do YouTube (MP4)", id: `${p}ytmp4` },
        { title: `${p}tiktok`, description: "Baixar vídeo do TikTok", id: `${p}tiktok` },
        { title: `${p}ig`, description: "Baixar vídeo/foto do Instagram", id: `${p}ig` },
        { title: `${p}fb`, description: "Baixar vídeo do Facebook", id: `${p}fb` },
      ]
    },
    {
      title: "🎨 Criatividade & Pesquisa",
      rows: [
        { title: `${p}st`, description: "Criar sticker (imagem/vídeo)", id: `${p}st` },
        { title: `${p}pin`, description: "Buscar imagens no Pinterest", id: `${p}pin` },
        { title: `${p}letra`, description: "Buscar letra de música", id: `${p}letra` },
      ]
    },
    {
      title: "⚙️ Configurações & Grupos",
      rows: [
        { title: `${p}autoai`, description: "Configurar resposta automática", id: `${p}autoai` },
        { title: `${p}grupo`, description: "Ferramentas de administração de grupo", id: `${p}grupo` },
        { title: `${p}status`, description: "Ver saúde do sistema e consumo", id: `${p}status` },
      ]
    },
    {
      title: "👑 Área do Dono",
      rows: [
        { title: `${p}painel`, description: "Painel de controle administrativo", id: `${p}painel` },
        { title: `${p}bc`, description: "Transmissão em massa (Broadcast)", id: `${p}bc` },
      ]
    }
  ];

  return { 
    texto: textoPrincipal, 
    tituloBotao, 
    secoes, 
    rodape: "Vincent AI Core • v1.1.0" 
  };
}
