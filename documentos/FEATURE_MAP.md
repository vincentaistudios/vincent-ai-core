# Mapa de Funcionalidades

Versão do documento: `0.0.1`


## Resumo

Este documento mapeia:

- Comandos disponíveis
- Parâmetros e exemplos
- Respostas esperadas
- Fluxos conversacionais
- Estados por chat/usuário
- Regras de negócio e proteções


## Convenções

- `prefixo`: definido em `data/config/settings.json` (default nos exemplos: `.`)
- “Criador”: usuário cujo JID bate com `settings.numerodono`
- “Chat”: `remoteJid` do Baileys (ex.: `...@g.us`, `...@s.whatsapp.net`)


## Comandos (tabela)

| Comando | Alias | Quem pode | Parâmetros | Efeito |
|---|---|---|---|---|
| `ia` | - | todos | `<texto>` | consulta IA via Groq |
| `groq` | - | todos | `<texto>` | alias do `.ia` |
| `status` | - | todos | - | status do bot e do chat atual |
| `autoai` | `aiauto` | criador | `status\|on\|off\|trigger` | controla modo IA automática por chat |
| `dryrun` | - | criador | `status\|on\|off` | ativa modo dry-run por chat |
| `replay` | - | criador | `last` | reenvia última resposta registrada no chat |
| `rerun` | - | criador | `last` | reprocessa última mensagem registrada no chat (texto) |
| `>` | - | criador | `<js>` | avalia JS local (debug) |
| `$` | - | criador | `<cmd>` | executa comando shell local (debug) |


## Detalhamento por comando


### ia

Uso:

```text
.ia <texto>
```

Fluxo:

- Seleciona uma chave Groq do pool configurado via env (`GROQ_API_KEYS` / `GROQ_API_KEY`), com rodízio automático.
- Chama Groq Chat Completions e responde com o texto retornado.

Regras:

- Rate limit por chave:
  - 20 rpm (20 requisições por minuto)
  - 1000 rpd (1000 requisições por dia)
- Quando a chave default atinge limite, o bot tenta as chaves secundárias automaticamente.

### groq

Uso:

```text
.groq <texto>
```

Fluxo:

- Alias de `.ia` (mesma pipeline).


### status

Uso:

```text
.status
```

Resposta:

- Mostra modo `autoai` do chat, dry-run, quantidade de chaves no env e link do dashboard local.

### autoai / aiauto

Uso:

```text
.autoai status
.autoai on
.autoai off
.autoai trigger
```

Estados:

- `on`  
  - default para chats privados  
  - responde automaticamente em texto (e tenta responder em mídia)

- `trigger`  
  - default para grupos  
  - antes de responder, chama roteador via Groq (`GROQ_MODEL_ROUTE`)

- `off`  
  - desliga respostas automáticas

Persistência:

- arquivo: `data/state/ai_auto_chats.json` (ou `AI_AUTO_STATE_PATH`)


### dryrun

Uso:

```text
.dryrun status
.dryrun on
.dryrun off
```

Comportamento:

- Quando ligado para um chat:
  - o bot não envia respostas para usuários comuns
  - apenas o criador recebe respostas com prefixo `DRYRUN:`

Persistência:

- arquivo: `data/state/chat_flags.json` (ou `BOT_FLAGS_PATH`)
- chave: `dryRun` (boolean)


### replay

Uso:

```text
.replay last
```

Comportamento:

- Busca último evento `outbound` do chat em `auditLog`
- Reenvia o texto gravado

Erros esperados:

- Sem histórico: “Nenhuma resposta anterior registrada neste chat.”


### rerun

Uso:

```text
.rerun last
```

Comportamento:

- Busca último evento `inbound` do chat em `auditLog`
- Reprocessa como se fosse texto novo:
  - em grupos `trigger`, chama roteador antes
  - chama Groq Chat Completions

Limitações:

- Se o último inbound tinha mídia: responde “rerun não suporta mídia (apenas texto).”


### Comandos administrativos de debug (`>` e `$`)

Uso:

```text
> 1 + 1
$ dir
```

Notas:

- Executam ações locais no host que roda o bot.
- Devem ser usados apenas em ambientes controlados.


## Fluxos conversacionais (alto nível)


### Mensagem de texto em privado (IA automática)

Condições de elegibilidade:

- `settings.aiAutoMode !== false`
- mensagem não é do próprio bot
- `mode !== off`
- texto “significativo” (tem `[a-z0-9]`)
- tamanho mínimo (>= 3)

Resposta:

- Seleciona chave (default/rodízio) e chama Groq Chat Completions.
- Responde com o texto retornado.


### Mensagem de texto em grupo (trigger)

Condições:

- `mode === trigger`

Decisão:

- Chama roteador via Groq Chat Completions (`GROQ_MODEL_ROUTE`)
- Só responde se `shouldRespond === true`

Cache:

- Decisões de rota são cacheadas por 30s por chat (normalizando texto).


### Mensagem com mídia

Tipos:

- `imageMessage`
- `audioMessage`
- `videoMessage`

Regras:

- Baixa mídia com limite (`maxMediaBytes` / `BOT_MAX_MEDIA_BYTES`)
- Imagem: chama Groq Chat Completions com `GROQ_MODEL_VISION`
- Áudio/vídeo: chama Groq Transcriptions e depois Groq Chat Completions


## Regras de negócio e proteções

- Política por chat:
  - `blockedChats` nega sempre
  - `allowedChats` (se não vazia) exige presença

- Rate limit por chave (Groq):
  - 20 rpm (por chave)
  - 1000 rpd (por chave)
  - arquivo: `data/state/groq_usage.json`

- Segurança de saída:
  - redaction de `Bearer ...`
  - bloqueio de padrões tipo `BEGIN PRIVATE KEY`
  - clamp de tamanho


## Estados persistidos

| Arquivo | Conteúdo | Quem escreve | Quando |
|---|---|---|---|
| `data/state/ai_auto_chats.json` | modo IA por chat | `aiAutoState` | `.autoai` / defaults |
| `data/state/chat_flags.json` | flags (ex.: dryRun) | `chatFlags` | `.dryrun` |
| `data/state/groq_usage.json` | uso por chave (rpm/rpd/mês) | `groqKeyUsage` | a cada request Groq |
| `data/state/audit_trail.json` | últimos eventos | `auditLog` | inbound/outbound/decision |


## Compatibilidade da Groq API

Este bot utiliza endpoints OpenAI-compatible da Groq:

- `POST /openai/v1/chat/completions`  
  - Entrada: `model`, `messages`  
  - Saída: `choices[0].message.content`

- `POST /openai/v1/audio/transcriptions`  
  - Entrada: multipart com `file` + `model`  
  - Saída: `{ text: string }`
