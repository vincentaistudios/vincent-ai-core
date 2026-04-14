import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAMINHO_USO_PADRAO = path.join(__dirname, '..', '..', 'banco_de_dados', 'estado', 'uso_groq.json');
const LIMITE_RPM = 20; // Requisições por minuto
const LIMITE_RPD = 1000; // Requisições por dia
const JANELA_RPM_MS = 60000;
const timestampsRpmPorChave = new Map();
/**
 * Retorna o caminho do arquivo de persistência de uso.
 */
function obterCaminhoUso() {
    return String(process.env.GROQ_USAGE_PATH || CAMINHO_USO_PADRAO);
}
function obterChaveHoje(data = new Date()) {
    return data.toISOString().slice(0, 10);
}
function obterChaveMes(data = new Date()) {
    return data.toISOString().slice(0, 7);
}
function lerJson(caminho, valorPadrao) {
    try {
        if (!fs.existsSync(caminho))
            return valorPadrao;
        const bruto = fs.readFileSync(caminho, 'utf8');
        return JSON.parse(bruto);
    }
    catch {
        return valorPadrao;
    }
}
function escreverJson(caminho, valor) {
    try {
        const diretorio = path.dirname(caminho);
        if (!fs.existsSync(diretorio))
            fs.mkdirSync(diretorio, { recursive: true });
        fs.writeFileSync(caminho, JSON.stringify(valor, null, 2));
        return true;
    }
    catch {
        return false;
    }
}
function lerArmazenamento() {
    const st = lerJson(obterCaminhoUso(), null);
    if (!st || typeof st !== 'object')
        return { versao: 1, chaves: {} };
    if (!st.chaves || typeof st.chaves !== 'object')
        st.chaves = {};
    if (!st.versao)
        st.versao = 1;
    return st;
}
function gravarArmazenamento(st) {
    return escreverJson(obterCaminhoUso(), st);
}
function garantirChave(st, idChave) {
    if (!st.chaves[idChave] || typeof st.chaves[idChave] !== 'object') {
        st.chaves[idChave] = {};
    }
    const k = st.chaves[idChave];
    if (!k.dia || typeof k.dia !== 'object') {
        k.dia = { data: obterChaveHoje(), contagem: 0 };
    }
    if (!k.mes || typeof k.mes !== 'object') {
        k.mes = { periodo: obterChaveMes(), contagem: 0 };
    }
    return k;
}
/**
 * Remove timestamps fora da janela de 1 minuto.
 */
function limparRpmAntigo(idChave, agoraMs) {
    const lista = timestampsRpmPorChave.get(idChave) || [];
    const corte = agoraMs - JANELA_RPM_MS;
    let i = 0;
    while (i < lista.length && lista[i] < corte)
        i++;
    const novaLista = i > 0 ? lista.slice(i) : lista;
    timestampsRpmPorChave.set(idChave, novaLista);
    return novaLista;
}
/**
 * Verifica se uma chave pode ser usada (dentro dos limites de RPM e RPD).
 */
export function podeUsarChave(idChave, agora = new Date()) {
    const agoraMs = agora.getTime();
    const listaRpm = limparRpmAntigo(idChave, agoraMs);
    if (listaRpm.length >= LIMITE_RPM) {
        const maisAntigo = listaRpm[0] || agoraMs;
        const esperarMs = Math.max(0, maisAntigo + JANELA_RPM_MS - agoraMs);
        return { ok: false, reason: 'limite_rpm', retryAfterSec: Math.ceil(esperarMs / 1000) };
    }
    const armazem = lerArmazenamento();
    const chave = garantirChave(armazem, idChave);
    const dataHoje = obterChaveHoje(agora);
    if (chave.dia.data !== dataHoje) {
        chave.dia = { data: dataHoje, contagem: 0 };
    }
    if (chave.dia.contagem >= LIMITE_RPD) {
        return { ok: false, reason: 'limite_rpd', retryAfterSec: 24 * 3600 };
    }
    return { ok: true, rpmUsado: listaRpm.length, rpdUsado: chave.dia.contagem };
}
/**
 * Registra o uso bem-sucedido de uma chave.
 */
export function registrarUso(idChave, agora = new Date()) {
    const agoraMs = agora.getTime();
    const listaRpm = limparRpmAntigo(idChave, agoraMs);
    listaRpm.push(agoraMs);
    timestampsRpmPorChave.set(idChave, listaRpm);
    const armazem = lerArmazenamento();
    const chave = garantirChave(armazem, idChave);
    const dataHoje = obterChaveHoje(agora);
    if (chave.dia.data !== dataHoje) {
        chave.dia = { data: dataHoje, contagem: 0 };
    }
    chave.dia.contagem = Number(chave.dia.contagem || 0) + 1;
    const periodoMes = obterChaveMes(agora);
    if (chave.mes.periodo !== periodoMes) {
        chave.mes = { periodo: periodoMes, contagem: 0 };
    }
    chave.mes.contagem = Number(chave.mes.contagem || 0) + 1;
    gravarArmazenamento(armazem);
    return {
        rpmUsado: listaRpm.length,
        rpdUsado: chave.dia.contagem,
        mesUsado: chave.mes.contagem
    };
}
/**
 * Obtém estatísticas de uma chave específica.
 */
export function obterEstatisticasChave(idChave, agora = new Date()) {
    const agoraMs = agora.getTime();
    const listaRpm = limparRpmAntigo(idChave, agoraMs);
    const armazem = lerArmazenamento();
    const chave = garantirChave(armazem, idChave);
    return {
        idChave,
        rpm: { usado: listaRpm.length, max: LIMITE_RPM },
        dia: { data: chave.dia.data, usado: Number(chave.dia.contagem || 0), max: LIMITE_RPD },
        mes: { periodo: chave.mes.periodo, usado: Number(chave.mes.contagem || 0) }
    };
}
/**
 * Retorna as estatísticas de todas as chaves rastreadas.
 */
export function obterTodasEstatisticas(agora = new Date()) {
    const armazem = lerArmazenamento();
    const resultado = [];
    for (const idChave of Object.keys(armazem.chaves || {})) {
        resultado.push(obterEstatisticasChave(idChave, agora));
    }
    return resultado;
}
