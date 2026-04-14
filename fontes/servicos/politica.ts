/**
 * Normaliza um identificador (JID) para comparação.
 */
function normalizarId(id: string): string {
  return String(id || '').trim().toLowerCase();
}

/**
 * Converte uma lista de IDs em um Conjunto (Set) para busca rápida.
 */
function listaParaConjunto(lista: string[] | undefined): Set<string> | null {
  if (!Array.isArray(lista)) return null;
  const conjunto = new Set<string>();
  for (const valor of lista) {
    const idNormalizado = normalizarId(valor);
    if (idNormalizado) conjunto.add(idNormalizado);
  }
  return conjunto;
}

/**
 * Verifica se um chat tem permissão para interagir com o robô baseado em listas de bloqueio/permissão.
 */
export function estaChatPermitido(idChat: string, configuracoes: any): boolean {
  const id = normalizarId(idChat);
  if (!id) return false;

  const bloqueados = listaParaConjunto(configuracoes?.blockedChats);
  if (bloqueados && bloqueados.has(id)) return false;

  const permitidos = listaParaConjunto(configuracoes?.allowedChats);
  if (permitidos && permitidos.size > 0) {
    return permitidos.has(id);
  }

  // Se o ambiente exigir lista de permissão estrita
  if (process.env.ROBO_EXIGIR_LISTA_PERMISSAO === '1') {
    return false;
  }

  return true;
}
