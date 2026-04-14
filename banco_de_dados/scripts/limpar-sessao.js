const { getSessionDir } = require('../src/contexto.js')
const { cleanSessionDir } = require('../src/services/limpador_sessao.js')

const dir = getSessionDir()
const r = cleanSessionDir(dir, { enabled: true })
process.stdout.write(JSON.stringify({ sessionDir: dir, ...r }, null, 2) + '\n')
