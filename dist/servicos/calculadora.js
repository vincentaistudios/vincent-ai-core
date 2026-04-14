/**
 * Calculadora Científica — Migrada do Nazuna (calculator.js)
 * Parser matemático seguro sem uso de eval().
 */
const CONSTANTES = {
    'pi': Math.PI, 'π': Math.PI,
    'e': Math.E,
    'phi': (1 + Math.sqrt(5)) / 2,
    'φ': (1 + Math.sqrt(5)) / 2,
};
const FUNCOES = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    log: Math.log10, log10: Math.log10, log2: Math.log2,
    ln: Math.log, exp: Math.exp,
    sqrt: Math.sqrt, cbrt: Math.cbrt, pow: Math.pow,
    abs: Math.abs, ceil: Math.ceil, floor: Math.floor,
    round: Math.round, trunc: Math.trunc, sign: Math.sign,
    max: Math.max, min: Math.min,
    rad: (deg) => deg * (Math.PI / 180),
    deg: (rad) => rad * (180 / Math.PI),
    fact: (n) => {
        if (n < 0 || !Number.isInteger(n))
            return NaN;
        if (n > 170)
            return Infinity;
        let r = 1;
        for (let i = 2; i <= n; i++)
            r *= i;
        return r;
    },
    percent: (v, p) => v * (p / 100),
};
function tokenizar(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
        const c = expr[i];
        if (/[0-9.]/.test(c)) {
            let num = c;
            i++;
            while (i < expr.length && /[0-9.eE+-]/.test(expr[i])) {
                if ((expr[i] === '+' || expr[i] === '-') && !/[eE]/.test(expr[i - 1]))
                    break;
                num += expr[i++];
            }
            tokens.push({ tipo: 'numero', valor: parseFloat(num) });
        }
        else if (/[a-zA-Zπφ]/.test(c)) {
            let id = c;
            i++;
            while (i < expr.length && /[a-zA-Z0-9]/.test(expr[i]))
                id += expr[i++];
            const low = id.toLowerCase();
            if (CONSTANTES[low] !== undefined)
                tokens.push({ tipo: 'numero', valor: CONSTANTES[low] });
            else if (FUNCOES[low])
                tokens.push({ tipo: 'funcao', valor: low });
            else
                throw new Error(`Função ou constante desconhecida: ${id}`);
        }
        else if (['+', '-', '*', '/', '%', '^'].includes(c)) {
            tokens.push({ tipo: 'operador', valor: c });
            i++;
        }
        else if (c === '(') {
            tokens.push({ tipo: 'lparen', valor: '(' });
            i++;
        }
        else if (c === ')') {
            tokens.push({ tipo: 'rparen', valor: ')' });
            i++;
        }
        else if (c === ',') {
            tokens.push({ tipo: 'virgula', valor: ',' });
            i++;
        }
        else if (/\s/.test(c))
            i++;
        else
            throw new Error(`Caractere inválido: ${c}`);
    }
    return tokens;
}
function parsear(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const consumir = () => tokens[pos++];
    const expressao = () => {
        let esq = termo();
        while (peek()?.tipo === 'operador' && ['+', '-'].includes(peek().valor)) {
            const op = consumir().valor;
            esq = { tipo: 'binario', operador: op, esquerda: esq, direita: termo() };
        }
        return esq;
    };
    const termo = () => {
        let esq = potencia();
        while (peek()?.tipo === 'operador' && ['*', '/', '%'].includes(peek().valor)) {
            const op = consumir().valor;
            esq = { tipo: 'binario', operador: op, esquerda: esq, direita: potencia() };
        }
        return esq;
    };
    const potencia = () => {
        let esq = unario();
        if (peek()?.tipo === 'operador' && peek().valor === '^') {
            consumir();
            esq = { tipo: 'binario', operador: '^', esquerda: esq, direita: potencia() };
        }
        return esq;
    };
    const unario = () => {
        if (peek()?.tipo === 'operador' && ['+', '-'].includes(peek().valor)) {
            const op = consumir().valor;
            return { tipo: 'unario', operador: op, operando: unario() };
        }
        return fator();
    };
    const fator = () => {
        const token = peek();
        if (!token)
            throw new Error('Expressão incompleta');
        if (token.tipo === 'numero') {
            consumir();
            return { tipo: 'numero', valor: token.valor };
        }
        if (token.tipo === 'funcao') {
            const nome = consumir().valor;
            if (peek()?.tipo !== 'lparen')
                throw new Error(`Esperado '(' após ${nome}`);
            consumir();
            const args = [];
            if (peek()?.tipo !== 'rparen') {
                args.push(expressao());
                while (peek()?.tipo === 'virgula') {
                    consumir();
                    args.push(expressao());
                }
            }
            if (peek()?.tipo !== 'rparen')
                throw new Error(`Esperado ')' após ${nome}`);
            consumir();
            return { tipo: 'funcao', nome, args };
        }
        if (token.tipo === 'lparen') {
            consumir();
            const expr = expressao();
            if (peek()?.tipo !== 'rparen')
                throw new Error("Esperado ')'");
            consumir();
            return expr;
        }
        throw new Error(`Token inesperado: ${token.valor}`);
    };
    const resultado = expressao();
    if (pos < tokens.length)
        throw new Error(`Token inesperado: ${tokens[pos]?.valor}`);
    return resultado;
}
function avaliar(no) {
    if (no.tipo === 'numero')
        return no.valor;
    if (no.tipo === 'unario') {
        const v = avaliar(no.operando);
        return no.operador === '-' ? -v : v;
    }
    if (no.tipo === 'binario') {
        const e = avaliar(no.esquerda), d = avaliar(no.direita);
        switch (no.operador) {
            case '+': return e + d;
            case '-': return e - d;
            case '*': return e * d;
            case '/':
                if (d === 0)
                    throw new Error('Divisão por zero');
                return e / d;
            case '%': return e % d;
            case '^': return Math.pow(e, d);
        }
    }
    if (no.tipo === 'funcao') {
        const fn = FUNCOES[no.nome];
        if (!fn)
            throw new Error(`Função desconhecida: ${no.nome}`);
        return fn(...no.args.map(avaliar));
    }
    throw new Error('Nó desconhecido');
}
/** Calcula uma expressão matemática de forma segura. */
export function calcular(expressao) {
    if (!expressao?.trim())
        return { ok: false, erro: 'expressao_vazia' };
    const expr = expressao.trim()
        .replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\*\*/g, '^');
    if (expr.length > 200)
        return { ok: false, erro: 'expressao_muito_longa' };
    try {
        const resultado = avaliar(parsear(tokenizar(expr)));
        if (!isFinite(resultado))
            return { ok: true, resultado: resultado > 0 ? '∞' : '-∞', expressao: expr };
        const formatado = Number.isInteger(resultado) ? String(resultado) : parseFloat(resultado.toFixed(10)).toString();
        return { ok: true, resultado: formatado, expressao: expr, mensagem: `🧮 *CALCULADORA*\n\n📝 ${expr}\n\n📊 *Resultado:* ${formatado}` };
    }
    catch (e) {
        return { ok: false, erro: e.message, mensagem: `🧮 *CALCULADORA*\n\n❌ Erro: ${e.message}` };
    }
}
/** Converte unidades (ex: km → mi, c → f). */
export function converter(valor, de, para) {
    const conversoes = {
        'c-f': v => v * 9 / 5 + 32, 'f-c': v => (v - 32) * 5 / 9,
        'c-k': v => v + 273.15, 'k-c': v => v - 273.15,
        'km-mi': v => v * 0.621371, 'mi-km': v => v * 1.60934,
        'm-ft': v => v * 3.28084, 'ft-m': v => v * 0.3048,
        'cm-in': v => v * 0.393701, 'in-cm': v => v * 2.54,
        'kg-lb': v => v * 2.20462, 'lb-kg': v => v * 0.453592,
        'l-gal': v => v * 0.264172, 'gal-l': v => v * 3.78541,
        'kb-mb': v => v / 1024, 'mb-gb': v => v / 1024, 'gb-tb': v => v / 1024,
    };
    const chave = `${de.toLowerCase()}-${para.toLowerCase()}`;
    const fn = conversoes[chave];
    if (!fn)
        return { ok: false, erro: 'conversao_nao_suportada' };
    const resultado = parseFloat(fn(valor).toFixed(6));
    return { ok: true, resultado, mensagem: `📐 *CONVERSÃO*\n\n${valor} ${de.toUpperCase()} = ${resultado} ${para.toUpperCase()}` };
}
