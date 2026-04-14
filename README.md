<div align="center">
  <img src="https://komarev.com/ghpvc/?username=vincent-ai-core-oficial&label=VISUALIZAÇÕES&color=FFD700&label_color=0B192C&style=for-the-badge" alt="Contador de Visitas" />
</div>

# 🤖 Vincent AI Core

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18.x-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_Cloud-Cloud_Run-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/WhatsApp-Connected-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" />
</p>

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=vincent-ai-core-oficial&label=VISUALIZAÇÕES&color=FFD700&label_color=0B192C&style=for-the-badge" alt="Contador de Visitas" />
</p>

> Bot WhatsApp com IA via Groq (texto, visão e transcrição), multi-key via `.env`, rate limit por chave e dashboard local.

## 🌌 Visão Geral

Este repositório contém um bot baseado em `@whiskeysockets/baileys`, com pipeline de IA usando a API da Groq.

## ✨ Funcionalidades Principais

- 💬 IA de texto (Groq Chat Completions)
- 🖼️ IA de imagem (Groq Vision)
- 🎧 Transcrição de áudio/vídeo (Groq Transcriptions)
- 🔑 Multi-key via `.env` (`GROQ_API_KEYS`) com rodízio e rate limit por chave (20rpm/1000rpd)
- 📊 Dashboard local de consumo (`npm run dashboard`)
- 🧹 Auto-limpeza opcional da sessão (intervalo configurável; mantém 20 mais recentes)
- 🛡️ Hardening: comandos admin desabilitados por padrão e allowlist opcional

<br/>


## Requisitos

- Node.js 18+
- npm

Opcional:

- Git (para clonar/atualizar)


## Estrutura do projeto

A raiz do repositório mantém apenas o essencial:

- `package.json` / `package-lock.json`
- `.gitignore`
- `data/` (código-fonte, scripts e dados do bot)

Conteúdo principal fica em `data/`:

- `data/src/` (código do bot)
- `data/config/` (configuração)
- `data/session/` (sessão do WhatsApp, não versionar)
- `data/state/` (estado local: quotas, flags, audit trail, etc., não versionar)
- `data/scripts/` (scripts utilitários)
- `data/tests/` (testes automatizados, opcional manter no repositório)


## Instalação (passo a passo)

1) Entre na pasta do projeto:

```bash
cd Bots/whatsapp-bot-public
```

2) Instale as dependências:

```bash
npm install
```

Durante o `npm install`, roda um check básico do ambiente:

```js
// data/scripts/check-env.js
// - valida Node 18+
// - valida presença do npm
// - avisa sobre Git (opcional)
```

3) Crie a configuração do bot:

- Arquivo obrigatório: `data/config/settings.json`

Exemplo mínimo:

```json
{
  "prefixo": ".",
  "nickbot": "Bot WhatsApp",
  "numerobot": "5500000000000",
  "nickdono": "Dono",
  "numerodono": "5500000000000"
}
```


## Configuração

Arquivo: `data/config/settings.json`

Campos obrigatórios:

- `prefixo` (string)  
  Ex.: `"."`  
  Comentário: prefixo para comandos explícitos.

- `nickbot` (string)  
  Ex.: `"Bot WhatsApp"`  
  Comentário: nome exibido em logs e mensagens.

- `nickdono` (string)  
  Ex.: `"Dono"`  
  Comentário: nome usado em mensagens administrativas.

- `numerodono` (string)  
  Ex.: `"5500000000000"`  
  Comentário: número do dono (apenas dígitos). Determina permissões de criador.

Campos opcionais:

- `numerobot` (string)  
  Ex.: `"5500000000000"`  
  Comentário: número do bot (apenas dígitos, com DDI). Usado para pareamento por código (`npm run start:code`) sem precisar digitar no terminal.

- `allowedChats` (array de strings)  
  Ex.: `["1203630...@g.us", "5511...@s.whatsapp.net"]`  
  Comentário: se definido e não vazio, o bot só executa nesses chats.

- `blockedChats` (array de strings)  
  Comentário: bloqueia chats específicos.

- `maxMediaBytes` (number)  
  Comentário: limite de bytes ao baixar mídia do WhatsApp (default: 6MB).

- `maxReplyChars` (number)  
  Comentário: limita tamanho de respostas (default: 2400).

- `metodo_pareamento` (string | null)
  Ex.: `"code"` ou `"qr"`
  Comentário: define o método de conexão. Se `null`, o bot perguntará no terminal ao iniciar.


## Variáveis de ambiente

Tabela de compatibilidade:

| Variável | Tipo | Default | Efeito |
|---|---:|---|---|
| `LOG_LEVEL` | string | `info` | nível do logger (`info`, `debug`, etc.) |
| `BAILEYS_EVENT_LOG` | `0/1` | `0` | ativa log detalhado de eventos do Baileys |
| `METRICS_ENABLED` | `0/1` | `0` | ativa métricas de processo |
| `METRICS_INTERVAL_MS` | number | `60000` | intervalo das métricas (mín. 10000ms) |
| `HTTP_POOLING_ENABLED` | `0/1` | `1` | ativa pooling/keep-alive para HTTP (fetch) |
| `HTTP_POOL_CONNECTIONS` | number | `20` | tamanho do pool de conexões HTTP |
| `HTTP_POOL_KEEPALIVE_TIMEOUT_MS` | number | `30000` | keep-alive timeout |
| `HTTP_POOL_KEEPALIVE_MAX_TIMEOUT_MS` | number | `120000` | keep-alive max timeout |
| `GROQ_API_KEYS` | string | - | lista de chaves (separadas por vírgula ou novas linhas) |
| `GROQ_API_KEY` | string | - | alternativa single-key (usada se `GROQ_API_KEYS` estiver vazio) |
| `GROQ_BASE_URL` | string | `https://api.groq.com/openai/v1` | base URL da API Groq |
| `GROQ_TIMEOUT_MS` | number | `15000` | timeout das chamadas para Groq |
| `GROQ_MODEL_TEXT` | string | `llama-3.3-70b-versatile` | modelo para texto (comando `.ia`) |
| `GROQ_MODEL_ROUTE` | string | `llama-3.1-8b-instant` | modelo para roteamento em grupos (`trigger`) |
| `GROQ_MODEL_VISION` | string | `llama-3.2-11b-vision-preview` | modelo para imagens |
| `GROQ_MODEL_TRANSCRIBE` | string | `whisper-large-v3` | modelo para transcrição de áudio/vídeo |
| `GROQ_USAGE_PATH` | path | `data/state/groq_usage.json` | arquivo local de uso por chave |
| `BOT_MAX_MEDIA_BYTES` | number | - | override do limite de mídia |
| `AI_AUTO_STATE_PATH` | path | `data/state/ai_auto_chats.json` | arquivo de estado do auto IA |
| `BOT_FLAGS_PATH` | path | `data/state/chat_flags.json` | arquivo de flags por chat |
| `BOT_USAGE_PATH` | path | `data/state/usage.json` | arquivo de contadores de quota |
| `BOT_AUDIT_PATH` | path | `data/state/audit_trail.json` | arquivo de auditoria (replay/rerun) |
| `BOT_AUDIT_STORE_TEXT` | `0/1` | `0` | se `1`, guarda texto no audit log (aumenta risco) |
| `BOT_ENABLE_EVAL` | `0/1` | `0` | habilita comando `>` (admin) |
| `BOT_ENABLE_SHELL` | `0/1` | `0` | habilita comando `$` (admin) |
| `BOT_REQUIRE_ALLOWLIST` | `0/1` | `0` | se `1`, só funciona quando `allowedChats` estiver configurado |
| `SESSION_CLEAN_ENABLED` | `0/1` | `0` | habilita auto-limpeza de `data/session/` |
| `SESSION_CLEAN_INTERVAL_MS` | number | `1800000` | intervalo da limpeza (default: 30 min) |
| `SESSION_CLEAN_KEEP` | number | `20` | mantém os 20 arquivos mais recentes |
| `SESSION_CLEAN_WHITELIST` | string | `creds.json` | whitelist (csv ou linhas) |
| `DASHBOARD_HOST` | string | `127.0.0.1` | host do dashboard local |
| `DASHBOARD_PORT` | number | `3099` | porta do dashboard local |
| `LOCK_WATCH_DELETE` | `0/1` | `1` | deleta `package-lock.json` após backup (script opt-in) |
| `LOCK_WATCH_BACKUP_DIR` | path | `data/state/lockfile_backups` | diretório de backups do lockfile |
| `PAIRING_METHOD` | string | - | `code` ou `qr` (override do método de pareamento) |
| `BOT_PHONE_NUMBER` | string | - | override do número do bot para pareamento por código |
| `LOTUS_NO_CLEAR` | `0/1` | `0` | evita apagar sessão automaticamente ao iniciar em modo CLI |


## IA: origem (Groq)

Este bot usa exclusivamente a API Groq para:

- Texto: `GROQ_MODEL_TEXT`
- Roteamento (grupos em modo `trigger`): `GROQ_MODEL_ROUTE`
- Imagem: `GROQ_MODEL_VISION`
- Transcrição (áudio/vídeo): `GROQ_MODEL_TRANSCRIBE`

O bot suporta múltiplas chaves via `.env`/variáveis de ambiente, com rodízio automático e rate limit por chave:

- 20 requisições por minuto (20 rpm)
- 1000 requisições por dia (1000 rpd)

Chaves:

- Configure `GROQ_API_KEYS` com uma lista (recomendado).
- Ou use `GROQ_API_KEY` para single-key.


## Groq: obter API key (passo a passo)

1) Crie uma conta e faça login no console da Groq:

- https://console.groq.com

2) Crie ou selecione um “Project”.

3) Gere uma API key no console.

4) Copie a chave e guarde em um gerenciador de senhas.

5) Configure no ambiente do bot (recomendado) ou via arquivo `.env` local.


## Groq: configuração no projeto

Opção A) Variável de ambiente (recomendado, produção):

Linux/macOS:

```bash
export GROQ_API_KEYS="key1,key2,key3"
export GROQ_MODEL_TEXT="llama-3.3-70b-versatile"
```

Windows (PowerShell):

```powershell
$env:GROQ_API_KEYS="key1,key2,key3"
$env:GROQ_MODEL_TEXT="llama-3.3-70b-versatile"
```

Opção B) `.env` local (para desenvolvimento):

1) Copie o template:

```bash
cp .env.example .env
```

2) Preencha `GROQ_API_KEYS` (ou `GROQ_API_KEY`) no `.env`.

3) Inicie o bot normalmente.  
   O entrypoint `data/src/conectar.js` carrega `.env` automaticamente se existir.


## Groq: multi-key (rodízio e rate limit)

Rate limit por chave:

- 20 requisições por minuto (20 rpm)
- 1000 requisições por dia (1000 rpd)

Rodízio automático:

- Quando uma chave atinge limite (rpm/rpd), o bot tenta automaticamente as próximas chaves do `GROQ_API_KEYS`.

Dashboard local (consumo):

```bash
npm run dashboard
```

Abre em: `http://127.0.0.1:3099/`


## Groq: exemplo de uso no bot

```text
.ia explique em uma frase o que é um motor 4 tempos
.groq explique em uma frase o que é um motor 4 tempos
```


## Groq: exemplo de integração em código

Exemplo simples (chamada direta):

```js
// Exemplo: usando o client nativo do projeto (sem dependências extras).
// Requer GROQ_API_KEY no ambiente.

const { groqChat } = require('./data/src/services/groqClient.js')

async function main() {
  const r = await groqChat({
    messages: [
      { role: 'system', content: 'Responda em português.' },
      { role: 'user', content: 'Diga "OK" e pare.' }
    ],
    temperature: 0
  })

  console.log(r.content)
}

main().catch((e) => {
  console.error(e.code || e.message)
  process.exit(1)
})
```


## Groq: segurança (não versionar / não vazar)

- `.env` e `.env.*` não são versionados (já estão no `.gitignore`).
- Nunca coloque a chave em `settings.json`, código-fonte ou prints.
- Evite logs que incluam headers Authorization.
- Em produção, prefira:
  - variáveis de ambiente do PM2/systemd
  - secret managers (quando aplicável)


## Como executar

Iniciar (modo padrão):

```bash
npm run start
```

Executar diretamente com Node (sem npm scripts):

```bash
node data/src/conectar.js
```

Pareamento via QR:

```bash
npm run start:qr
```

Pareamento via código (quando aplicável):

```bash
npm run start:code
```

Pareamento por código (100% automático):

1) Configure `numerobot` em `data/config/settings.json` (apenas dígitos com DDI).
2) Rode:

```bash
npm run start:code
```

O bot usa o `numerobot` automaticamente e imprime o código no terminal.

Observação:

- O QR é mostrado apenas no terminal (não gera `qr.png` no projeto).
- O pareamento por código pode falhar com `401 Connection Failure` dependendo da conta/aparelho/servidor do WhatsApp. Quando isso ocorrer, use QR (modo mais estável).
- **Interatividade**: Se você não definir um método no `settings.json` nem usar flags de CLI, o bot perguntará no terminal: `Escolha o método: [1] Código [2] QR Code`.

Linux (loop de reinício automático):

```bash
npm run start:linux
```

Observação:

- O bot cria e usa sessão em `data/session/` (não versionar).


## Execução em produção (PM2 / systemd / Windows)

O bot é um processo “stateful” (mantém sessão e conexão). Em geral:

- Use 1 instância por sessão.
- Evite `cluster`/`instances > 1` no PM2, a menos que você saiba exatamente como isolar sessões por instância.


### PM2

Instalação (global):

```bash
npm i -g pm2
```

Rodar em background:

```bash
pm2 start data/src/conectar.js --name whatsapp-bot
```

Com parâmetros do bot:

```bash
# -- separa os argumentos que vão para o script
pm2 start data/src/conectar.js --name whatsapp-bot -- --qr
```

Persistir no boot:

```bash
pm2 save
pm2 startup
```

Logs:

```bash
pm2 logs whatsapp-bot
```


### systemd (Linux)

Exemplo de unidade (ajuste paths/usuário):

```ini
[Unit]
Description=WhatsApp Bot (Baileys)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/whatsapp-bot-public
ExecStart=/usr/bin/node /opt/whatsapp-bot-public/data/src/conectar.js --code
Restart=always
RestartSec=3
Environment=LOG_LEVEL=info

[Install]
WantedBy=multi-user.target
```

Comandos:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now whatsapp-bot.service
sudo systemctl status whatsapp-bot.service
```


### Windows (Task Scheduler)

Sugestão:

- Crie uma tarefa agendada “Ao iniciar o computador” / “Ao logon”.
- Ação: iniciar um programa
  - Programa/script: `node`
  - Argumentos: `data/src/conectar.js --code`
  - Iniciar em: `C:\...\Bots\whatsapp-bot-public`


### Docker (opcional)

Este repositório não inclui Dockerfile por padrão.

Se você quiser rodar em Docker, o importante é:

- Montar volume para `data/session/` e `data/state/` (persistência).
- Expor/fornecer `data/config/settings.json` via volume/secret.


## Exemplos de uso

Buscar produtos:

```text
.buscar filtro de óleo
```

Chamar IA (texto):

```text
.ia preciso de uma sugestão para pastilhas de freio
```

Controlar IA automática (apenas criador):

```text
.autoai status
.autoai on
.autoai off
.autoai trigger
```

Dry-run (apenas criador):

```text
.dryrun status
.dryrun on
.dryrun off
```

Replay e rerun (apenas criador):

```text
.replay last
.rerun last
```


## Segurança

O bot inclui recursos administrativos que podem ser perigosos em produção pública.

- Comandos `>` e `$` executam eval/exec local para o criador.
  - Comentário: isso é útil para debug, mas aumenta risco operacional.
  - Recomenda-se remover ou colocar atrás de feature flag antes de uso público amplo.


## Testes

```bash
npm test
```

Se não houver arquivos de teste no repositório, o comando apenas não executa nenhum teste e finaliza.

Teste de integração com Groq (faz chamada real, opcional):

Linux/macOS:

```bash
export GROQ_API_KEY="sua-chave-aqui"
export GROQ_RUN_INTEGRATION_TESTS=1
npm run test:groq
```

Windows (PowerShell):

```powershell
$env:GROQ_API_KEY="sua-chave-aqui"
$env:GROQ_RUN_INTEGRATION_TESTS=1
npm run test:groq
```


## Troubleshooting

Sessão desconectada (401):

- Apague `data/session/` e faça o pareamento novamente:

```bash
rm -rf data/session
npm run start:qr
```

QR expira:

- Aguarde, o bot gera um novo automaticamente.

Bot não inicia por falta de config:

- Verifique se `data/config/settings.json` existe e está válido.

Sem respostas em determinados grupos:

- Verifique `allowedChats` / `blockedChats`.
- Em grupos com `autoai trigger`, o roteador pode decidir ignorar mensagens.

Erro `GROQ_API_KEY_MISSING` ou “GROQ_API_KEY não configurada”:

- Configure `GROQ_API_KEY` no ambiente (ou via `.env`).
- Reinicie o processo (PM2/systemd) após alterar variáveis.

Erro `GROQ_HTTP_ERROR`:

- Verifique se `GROQ_API_KEY` está correta e ativa no console.
- Verifique conectividade de rede e proxy.
- Confirme `GROQ_BASE_URL` (default: `https://api.groq.com/openai/v1`).

Erros 429 (rate limit):

- Aguarde e tente novamente.
- Considere criar um Project separado para dev/prod e revisar limites.


## Documentação técnica

- Guia técnico: `docs/TECHNICAL_GUIDE.md`
- Mapa de funcionalidades: `docs/FEATURE_MAP.md`
