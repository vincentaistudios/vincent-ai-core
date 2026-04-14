import axios from 'axios';
import { logger, marca } from '../nucleo/contexto.js';

/**
 * Interface para resultados de busca web.
 */
export interface ResultadoBusca {
  titulo: string;
  link: string;
  conteudo: string;
}

/**
 * Realiza uma busca web usando a API do Tavily.
 * Requer TAVILY_API_KEY no .env
 */
export async function buscarNaWeb(query: string, maxResultados: number = 3): Promise<ResultadoBusca[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    logger.warn(`${marca} TAVILY_API_KEY não encontrada no .env. Busca web desativada.`);
    return [];
  }

  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: apiKey,
      query: query,
      search_depth: "basic",
      max_results: maxResultados,
      include_answer: false,
      include_raw_content: false,
      include_images: false
    });

    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results.map((r: any) => ({
        titulo: r.title,
        link: r.url,
        conteudo: r.content
      }));
    }

    return [];
  } catch (erro) {
    logger.error(erro, `${marca} Erro ao buscar na web (Tavily)`);
    return [];
  }
}

/**
 * Formata os resultados da busca em um texto amigável para o prompt da IA.
 */
export function formatarResultadosParaIA(resultados: ResultadoBusca[]): string {
  if (resultados.length === 0) return "Nenhum resultado de busca encontrado.";

  return resultados.map((r, i) => 
    `--- Resultado ${i + 1} ---\n` +
    `Título: ${r.titulo}\n` +
    `Fonte: ${r.link}\n` +
    `Resumo: ${r.conteudo}`
  ).join('\n\n');
}
