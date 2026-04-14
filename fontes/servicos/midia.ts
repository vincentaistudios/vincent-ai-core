/**
 * Coleta os dados de um fluxo (stream) de mídia até um limite de bytes especificado.
 * Previne que o bot consuma memória excessiva com arquivos muito grandes.
 */
export async function coletarFluxoComLimite(fluxo: AsyncIterable<any>, limiteBytes: number): Promise<Buffer> {
  const pedacos: Buffer[] = [];
  let totalBytes = 0;
  
  for await (const pedaco of fluxo) {
    const buffer = Buffer.isBuffer(pedaco) ? pedaco : Buffer.from(pedaco);
    totalBytes += buffer.length;
    
    if (totalBytes > limiteBytes) {
      const erro: any = new Error('MIDIA_MUITO_GRANDE');
      erro.codigo = 'MIDIA_MUITO_GRANDE';
      erro.limiteBytes = limiteBytes;
      erro.totalBytes = totalBytes;
      throw erro;
    }
    
    pedacos.push(buffer);
  }
  
  return Buffer.concat(pedacos);
}
