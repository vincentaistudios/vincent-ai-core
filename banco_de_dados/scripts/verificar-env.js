const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

function parseMajor(version) {
  const m = String(version || '').match(/^v?(\d+)\./)
  return m ? Number(m[1]) : 0
}

function hasCommand(cmd, args = ['--version']) {
  try {
    if (cmd === 'npm' && process.env.npm_config_user_agent) return true
    const isWin = process.platform === 'win32'
    const candidates = isWin && !cmd.toLowerCase().endsWith('.cmd') ? [cmd, `${cmd}.cmd`] : [cmd]
    for (const c of candidates) {
      const r = spawnSync(c, args, { stdio: 'ignore', shell: false })
      if (r.status === 0) return true
    }
    return false
  } catch {
    return false
  }
}

function out(msg) {
  process.stdout.write(`[bot-env] ${msg}\n`)
}

function fail(msg) {
  process.stderr.write(`[bot-env] ${msg}\n`)
  process.exit(1)
}

const nodeMajor = parseMajor(process.version)
if (nodeMajor < 18) fail(`Node.js 18+ é obrigatório. Detectado: ${process.version}`)

if (!hasCommand('npm')) fail('npm não encontrado no PATH.')

if (!hasCommand('git')) out('Git não encontrado (recomendado, mas não obrigatório).')

const settingsPath = path.join(__dirname, '..', 'config', 'settings.json')
if (!fs.existsSync(settingsPath)) {
  out(`settings.json não encontrado em: ${settingsPath}`)
  out('Crie o arquivo antes de iniciar o bot (veja README do bot).')
}

out('OK')
