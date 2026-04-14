import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define o caminho onde as configurações de IA automática de cada chat serão salvas
const CAMINHO_ESTADO = process.env.CAMINHO_ESTADO_IA || path.join(__dirname, '..', '..', 'banco_de_dados', 'estado', 'ia_auto_chats.json');
/**
 * Lê o estado atual dos chats do arquivo JSON.
 */
function lerEstado() {
    try {
        if (!fs.existsSync(CAMINHO_ESTADO))
            return {};
        const conteudoBruto = fs.readFileSync(CAMINHO_ESTADO, 'utf8');
        const objeto = JSON.parse(conteudoBruto);
        return (objeto && typeof objeto === 'object') ? objeto : {};
    }
    catch (erro) {
        return {};
    }
}
/**
 * Salva o estado atualizado no arquivo JSON.
 */
function gravarEstado(novoEstado) {
    try {
        const diretorio = path.dirname(CAMINHO_ESTADO);
        if (!fs.existsSync(diretorio)) {
            fs.mkdirSync(diretorio, { recursive: true });
        }
        fs.writeFileSync(CAMINHO_ESTADO, JSON.stringify(novoEstado, null, 2));
    }
    catch (erro) {
        console.error("Erro ao gravar estado da IA:", erro);
    }
}
/**
 * Retorna o modo de IA para um chat específico.
 */
export function obterModoChat(idChat, ehGrupo) {
    const estado = lerEstado();
    const valorBruto = estado[idChat];
    const valor = String(valorBruto || '').toLowerCase().trim();
    if (valor === 'on' || valor === 'off' || valor === 'trigger') {
        return valor;
    }
    // Padrão: Grupos começam em 'trigger' (responde apenas se detectado interesse pela IA)
    // Chats privados começam em 'on' (IA ativa para tudo)
    return ehGrupo ? 'trigger' : 'on';
}
/**
 * Define e persiste o modo de IA para um chat específico.
 */
export function definirModoChat(idChat, modo) {
    const m = String(modo || '').toLowerCase().trim();
    if (!(m === 'on' || m === 'off' || m === 'trigger'))
        return false;
    const estado = lerEstado();
    estado[idChat] = m;
    gravarEstado(estado);
    return true;
}
