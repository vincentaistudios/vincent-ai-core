import crypto from 'node:crypto';

/**
 * Gera um hash SHA256 em formato hexadecimal para um identificador único.
 */
function gerarHashSha256(texto: string): string {
  return crypto.createHash('sha256').update(String(texto || ''), 'utf8').digest('hex');
}

/**
 * Divide uma string bruta de chaves (separadas por vírgula ou quebra de linha).
 */
function dividirChaves(bruto: string | undefined): string[] {
  return String(bruto || '')
    .split(/[\n,]+/g)
    .map((x) => String(x || '').trim())
    .filter(Boolean);
}

/**
 * Extrai todas as chaves de API da Groq definidas no ambiente.
 */
function obterChavesApiGroqDoAmbiente(): string[] {
  const lista = dividirChaves(process.env.GROQ_API_KEYS);
  const unica = String(process.env.GROQ_API_KEY || '').trim();
  
  const chaves = lista.length ? lista : (unica ? [unica] : []);
  const unicas: string[] = [];
  const jaVistas = new Set<string>();
  
  for (const k of chaves) {
    if (jaVistas.has(k)) continue;
    jaVistas.add(k);
    unicas.push(k);
  }
  return unicas;
}

/**
 * Retorna o pool de chaves devidamente identificadas.
 */
export function obterPoolChavesGroq() {
  const chaves = obterChavesApiGroqDoAmbiente();
  return chaves.map((chaveApi) => ({ 
      id: `gk_${gerarHashSha256(chaveApi).slice(0, 16)}`, 
      apiKey: chaveApi 
  }));
}
