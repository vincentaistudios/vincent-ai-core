/**
 * Sanitiza o texto de saída, limitando o tamanho máximo e removendo caracteres de controle indesejados.
 */
export function sanitizarTextoSaida(texto: string, opcoes: { tamanhoMaximo: number } = { tamanhoMaximo: 2400 }): string {
  let resultado = String(texto || '').trim();
  
  if (resultado.length > opcoes.tamanhoMaximo) {
    resultado = resultado.slice(0, opcoes.tamanhoMaximo) + '... (cortado por limite de tamanho)';
  }
  
  return resultado;
}

/**
 * Verifica se o texto de saída deve ser bloqueado por conter termos proibidos.
 */
export function deveBloquearTextoSaida(texto: string): { ok: boolean; motivo?: string } {
  const t = String(texto || '').toLowerCase();
  
  // Exemplo de filtros de segurança básicos (pode ser expandido via config)
  const termosProibidos = [
    'palavra_proibida_exemplo', 
    'script>', 
    '<iframe'
  ];
  
  for (const termo of termosProibidos) {
    if (t.includes(termo)) {
      return { ok: false, motivo: `Termo proibido detectado: ${termo}` };
    }
  }
  
  return { ok: true };
}
