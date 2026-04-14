const fs = require('node:fs')
const path = require('node:path')
const { backupAndMaybeDeleteLockfile } = require('../fonte/servicos/gerenciador_lock.js')

const root = path.join(__dirname, '..', '..')
const lockPath = path.join(root, 'package-lock.json')
const backupDir = String(process.env.LOCK_WATCH_BACKUP_DIR || path.join(root, 'banco_de_dados', 'estado', 'lockfile_backups'))
const deleteLock = String(process.env.LOCK_WATCH_DELETE || '1').trim() !== '0'

async function backupAndMaybeDelete() {
  const r = await backupAndMaybeDeleteLockfile({ lockPath, backupDir, deleteLock })
  if (r.skipped) return false
  if (!r.ok) {
    // Silencioso conforme solicitado
    return false
  }
  return true
}

async function main() {
  await backupAndMaybeDelete()

  const watcher = fs.watch(root, { persistent: true }, async (_event, filename) => {
    if (String(filename || '').toLowerCase() !== 'package-lock.json') return
    await backupAndMaybeDelete()
  })

  process.on('SIGINT', () => {
    try { watcher.close() } catch {}
    process.exit(0)
  })
}

main().catch((e) => {
  process.stdout.write(`[lock-watch] error: ${String(e?.message || e)}\n`)
  process.exit(1)
})
