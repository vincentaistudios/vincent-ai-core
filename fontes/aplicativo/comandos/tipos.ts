/**
 * Interface para o contexto do comando.
 */
export interface ContextoComando {
  comando: string;
  argumentos: string[];
  consulta: string;
  corpo: string;
  ehCriador: boolean;
  ehGrupo: boolean;
  origem: string;
  remetente: string;
  prefixo: string;
  marca: string;
  configuracoes: any;
  responder: (mensagem: string, tipo?: string, opcoes?: any) => Promise<any>;
  conexao: any;
  [key: string]: any;
}

/**
 * Tipo para a função do comando.
 */
export type FuncaoComando = (ctx: ContextoComando) => Promise<boolean>;
