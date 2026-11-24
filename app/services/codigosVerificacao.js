// Códigos de verificação de e-mail (6 dígitos).
// Guardados em MEMÓRIA do processo: reiniciar o servidor invalida os códigos pendentes e, com várias
// instâncias rodando, o armazenamento precisa ser compartilhado (banco ou Redis). Só o hash é guardado.

const crypto = require("node:crypto");
const config = require("../config");

const MINUTOS_VALIDADE = 10;
const MAX_TENTATIVAS = 5;
const INTERVALO_REENVIO_MS = 60 * 1000;
const MAX_ENVIOS_POR_HORA = 5;
const VALIDADE_TOKEN_MS = 15 * 60 * 1000;

// Sem SECRET_KEY (desenvolvimento) usa um segredo temporário, que muda a cada reinício.
const segredo = config.secretKey || crypto.randomBytes(32).toString("hex");

const registros = new Map();

const chaveDe = (email, finalidade) => `${finalidade}:${email}`;
const assinar = (texto) => crypto.createHmac("sha256", segredo).update(texto).digest("base64url");
const hashDoCodigo = (codigo, email, finalidade) => assinar(`codigo|${finalidade}|${email}|${codigo}`);

function iguais(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

class ErroLimite extends Error {
  constructor(mensagem, esperarSegundos) {
    super(mensagem);
    this.name = "ErroLimite";
    this.esperarSegundos = esperarSegundos;
  }
}

// Gera um código novo (respeitando os limites de reenvio) e devolve o código em texto para ser enviado por e-mail.
function emitirCodigo(email, finalidade, agora = Date.now()) {
  const chave = chaveDe(email, finalidade);
  const anterior = registros.get(chave);

  if (anterior && agora - anterior.enviadoEm < INTERVALO_REENVIO_MS) {
    const esperar = Math.ceil((INTERVALO_REENVIO_MS - (agora - anterior.enviadoEm)) / 1000);
    throw new ErroLimite(`Aguarde ${esperar}s para pedir um novo código.`, esperar);
  }
  const envios = (anterior?.envios ?? []).filter((momento) => agora - momento < 60 * 60 * 1000);
  if (envios.length >= MAX_ENVIOS_POR_HORA) {
    throw new ErroLimite("Muitos códigos solicitados. Tente novamente mais tarde.", 600);
  }

  const codigo = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  registros.set(chave, {
    hash: hashDoCodigo(codigo, email, finalidade),
    expiraEm: agora + MINUTOS_VALIDADE * 60 * 1000,
    tentativas: 0,
    enviadoEm: agora,
    envios: [...envios, agora],
  });
  return { codigo, minutosValidade: MINUTOS_VALIDADE };
}

// Confere o código. Se estiver certo, devolve um token assinado que comprova o e-mail (vale 15 minutos).
function conferirCodigo(email, finalidade, codigo, agora = Date.now()) {
  const chave = chaveDe(email, finalidade);
  const registro = registros.get(chave);
  if (!registro || agora > registro.expiraEm) {
    registros.delete(chave);
    return { ok: false, mensagem: "O código expirou. Peça um novo código." };
  }
  if (registro.tentativas >= MAX_TENTATIVAS) {
    registros.delete(chave);
    return { ok: false, mensagem: "Muitas tentativas incorretas. Peça um novo código." };
  }
  registro.tentativas += 1;
  if (!iguais(registro.hash, hashDoCodigo(codigo, email, finalidade))) {
    return { ok: false, mensagem: "Código incorreto. Confira e tente novamente." };
  }
  registros.delete(chave); // uso único
  return { ok: true, tokenVerificacao: criarToken({ email, finalidade }, agora) };
}

// Usado quando o e-mail não pôde ser enviado: libera um novo pedido logo em seguida.
function cancelarEmissao(email, finalidade) {
  registros.delete(chaveDe(email, finalidade));
}

function criarToken({ email, finalidade }, agora = Date.now()) {
  const corpo = Buffer.from(JSON.stringify({ email, finalidade, exp: agora + VALIDADE_TOKEN_MS })).toString("base64url");
  return `${corpo}.${assinar(`token|${corpo}`)}`;
}

// Para a equipe da API: confirma que o token é autêntico e ainda válido. Devolve { email, finalidade } ou null.
function verificarToken(token, agora = Date.now()) {
  const [corpo, assinatura] = String(token ?? "").split(".");
  if (!corpo || !assinatura || !iguais(assinatura, assinar(`token|${corpo}`))) return null;
  try {
    const dados = JSON.parse(Buffer.from(corpo, "base64url").toString());
    return agora < dados.exp ? { email: dados.email, finalidade: dados.finalidade } : null;
  } catch {
    return null;
  }
}

function limparExpirados(agora = Date.now()) {
  for (const [chave, registro] of registros) {
    if (agora > registro.expiraEm + 60 * 60 * 1000) registros.delete(chave);
  }
}
setInterval(limparExpirados, 10 * 60 * 1000).unref();

module.exports = { emitirCodigo, conferirCodigo, cancelarEmissao, verificarToken, ErroLimite, MINUTOS_VALIDADE, _registros: registros };
