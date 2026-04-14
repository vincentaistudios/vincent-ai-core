/**
 * Utilitários para banners e manipulação de arquivos.
 */

/**
 * Gera um nome de arquivo aleatório com a extensão fornecida.
 */
export function obterAleatorio(extensao: string): string {
  return `${Math.floor(Math.random() * 10000)}${extensao}`;
}

/**
 * Alias para obterAleatorio (compatibilidade legado).
 */
export const getRandom = obterAleatorio;
