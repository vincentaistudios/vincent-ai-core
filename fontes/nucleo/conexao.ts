import { 
  makeWASocket, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion, 
  makeCacheableSignalKeyStore,
  DisconnectReason,
  WASocket
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Importações internas traduzidas
import { carregarVariaveisAmbiente } from './carregar_env.js';
import { 
  marca, 
  configuracoesBot, 
  colors, 
  obterDiretorioSessao, 
  hora, 
  data, 
  nomeBot,
  logger
} from './contexto.js';
import { metodoPareamento } from './configuracao.js';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregamento de ambiente
try { carregarVariaveisAmbiente(); } catch {}

// Suprimindo logs excessivos do Baileys
const originalConsoleInfo = console.info;
console.info = function (...args) {
  const mensagem = typeof args[0] === 'string' ? args[0] : '';
  if (mensagem.includes("Closing session: SessionEntry")) return;
  if (mensagem.includes("Removing old closed session: SessionEntry {}")) return;
  return originalConsoleInfo.apply(console, args);
};

let interfaceLeitura: readline.Interface | null = null;

/**
 * Garante que a interface de leitura do terminal esteja disponível para interação.
 */
function garantirInterfaceLeitura(): readline.Interface {
  if (!interfaceLeitura) {
    interfaceLeitura = readline.createInterface({ 
      input: process.stdin, 
      output: process.stdout 
    });
  }
  return interfaceLeitura;
}

/**
 * Faz uma pergunta ao usuário no terminal e retorna a resposta.
 */
const perguntar = (texto: string): Promise<string> => new Promise((resolver) => {
  const rli = garantirInterfaceLeitura();
  rli.question(texto, (resposta) => resolver(resposta));
});

const opcoesCliCodigo = process.argv.includes("--code");
const opcoesCliQr = process.argv.includes("--qr");

const preferenciasPareamento = {
  metodo: opcoesCliCodigo ? 'code' : (opcoesCliQr ? 'qr' : (metodoPareamento || null)),
  numeroTelefone: null as string | null,
  falhas401: 0
};

/**
 * Aguarda um pequeno intervalo.
 */
const esperar = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

/**
 * Solicita o código de pareamento com lógica de tentativa em caso de falha de conexão.
 */
async function solicitarCodigoPareamentoComTentativa(conexao: any, numero: string) {
  const tentativas = 3;
  for (let i = 0; i < tentativas; i++) {
    try {
      const codigoBruto = await conexao.requestPairingCode(numero);
      return { ok: true, codigoBruto };
    } catch (erro) {
      if (String(erro).toLowerCase().includes('connection closed')) {
        await esperar(1500 + i * 1500);
        continue;
      }
      return { ok: false, erro };
    }
  }
  return { ok: false, erro: new Error('Conexão fechada após múltiplas tentativas.') };
}

/**
 * Função principal de inicialização do robô.
 */
async function iniciarRobo() {
  const diretorioSessao = obterDiretorioSessao();
  
  // Limpeza de cache se solicitado via CLI
  if ((opcoesCliCodigo || opcoesCliQr) && process.env.MANTER_SESSAO !== "1") {
    try { fs.rmSync(diretorioSessao, { recursive: true, force: true }); } catch {}
    process.env.MANTER_SESSAO = "1";
  }

  const { state, saveCreds } = await useMultiFileAuthState(diretorioSessao);
  
  // Usar versão estável do Nazuna para melhor compatibilidade com Pairing Code
  // Versão: [2, 3000, 1034740716]
  const versaoEstavel: [number, number, number] = [2, 3000, 1034740716];
  const { version: versaoRecente } = await fetchLatestBaileysVersion();
  const version = versaoEstavel || versaoRecente;
  
  const loggerBaileys = pino({ level: 'silent' });

  let usarCodigo = false;
  const jaAutenticado = !!state?.creds?.registered;

  if (!jaAutenticado) {
    if (preferenciasPareamento.metodo === 'code' || opcoesCliCodigo) usarCodigo = true;
    else if (preferenciasPareamento.metodo === 'qr' || opcoesCliQr) usarCodigo = false;
    else {
      const resp = await perguntar(`${marca} Escolha o método: [1] Código de Telefone [2] QR Code (padrão): `);
      usarCodigo = resp.trim() === '1';
    }
  }

  const conexao = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, loggerBaileys),
    },
    printQRInTerminal: false,
    logger: loggerBaileys,
    browser: ['Chrome (Linux)', 'Google Chrome', '110.0.5481.177'],
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    qrTimeout: 120000,
  });

  if (usarCodigo && !jaAutenticado) {
    let numero = preferenciasPareamento.numeroTelefone || process.env.NUMERO_BOT || configuracoesBot.numerobot || '';
    if (!numero) {
      numero = await perguntar(`${marca} Digite o número do bot (ex: 5511999999999): `);
    }
    numero = numero.replace(/[^0-9]/g, "");
    
    const resultado = await solicitarCodigoPareamentoComTentativa(conexao, numero);
    if (resultado.ok) {
      const codigo = resultado.codigoBruto?.match(/.{1,4}/g)?.join("-");
      console.log(`${marca} Código de Pareamento: ${codigo}`);
    } else {
      console.error(`${marca} Falha ao gerar código:`, resultado.erro);
    }
  }

  conexao.ev.process(async (eventos) => {
    if (eventos['connection.update']) {
      const { connection, lastDisconnect, qr } = eventos['connection.update'];
      
      if (qr && !usarCodigo) {
        console.log(`${marca} Escaneie o QR Code abaixo:`);
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const codigoStatus = (lastDisconnect?.error as Boom)?.output?.statusCode || DisconnectReason.loggedOut;
        if (codigoStatus !== DisconnectReason.loggedOut) {
          console.log(`${marca} Conexão fechada. Motivo: ${codigoStatus}. Reconectando...`);
          setTimeout(iniciarRobo, 3000);
        } else {
          const arquivosSessao = fs.readdirSync(diretorioSessao).filter(f => f !== 'creds.json');
          if (arquivosSessao.length > 0 || fs.existsSync(path.join(diretorioSessao, 'creds.json'))) {
             console.log(`${marca} Sessão encerrada ou deslogada. Delete o conteúdo da pasta 'sessao' para parear novamente.`);
          } else {
             console.log(`${marca} Conexão encerrada. Tentando reconectar...`);
             setTimeout(iniciarRobo, 5000);
          }
        }
      }

      if (connection === 'open') {
        console.log(`${marca} Conectado com sucesso em ${data()} às ${hora()}`);
      }
    }

    if (eventos['creds.update']) {
      await saveCreds();
    }
    
    if (eventos['messages.upsert']) {
      const upsert = eventos['messages.upsert'];
      // Aqui chamamos o manipulador de mensagens traduzido
      try {
        const { carregarManipulador } = await import('./manipulador_mensagens.js');
        carregarManipulador(upsert, conexao);
      } catch (err) {
        console.error("Erro ao carregar manipulador de mensagens:", err);
      }
    }
  });
}

iniciarRobo().catch(erro => console.error(`${marca} Erro fatal:`, erro));
