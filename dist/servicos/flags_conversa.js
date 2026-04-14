import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Caminho onde as flags (preferências booleanas) dos chats serão salvas
const CAMINHO_FLAGS = process.env.CAMINHO_FLAGS_BOT || path.join(__dirname, '..', '..', 'banco_de_dados', 'estado', 'flags_chats.json');
/**
 * Lê o arquivo de flags do disco.
 */
function lerFlags() {
    try {
        if (!fs.existsSync(CAMINHO_FLAGS))
            return {};
        const conteudoBruto = fs.readFileSync(CAMINHO_FLAGS, 'utf8');
        const objeto = JSON.parse(conteudoBruto);
        return objeto && typeof objeto === 'object' ? objeto : {};
    }
    catch (erro) {
        return {};
    }
}
/**
 * Grava o objeto de flags no disco.
 */
function gravarFlags(novoEstado) {
    try {
        const diretorio = path.dirname(CAMINHO_FLAGS);
        if (!fs.existsSync(diretorio)) {
            fs.mkdirSync(diretorio, { recursive: true });
        }
        fs.writeFileSync(CAMINHO_FLAGS, JSON.stringify(novoEstado, null, 2));
    }
    catch (erro) {
        // Ignora falhas de gravação silenciosamente ou loga adequadamente
    }
}
/**
 * Obtém uma flag específica para um chat.
 */
export function obterFlagChat(idChat, chave, valorPadrao = false) {
    const flags = lerFlags();
    const valor = flags?.[idChat]?.[chave];
    return valor !== undefined ? valor : valorPadrao;
}
/**
 * Define uma flag específica para um chat.
 */
export function definirFlagChat(idChat, chave, valor) {
    const flags = lerFlags();
    if (!flags[idChat] || typeof flags[idChat] !== 'object') {
        flags[idChat] = {};
    }
    flags[idChat][chave] = valor;
    gravarFlags(flags);
    return true;
}
