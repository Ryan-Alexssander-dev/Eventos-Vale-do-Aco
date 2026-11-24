const crypto = require("node:crypto");
const config = require("../config");

const segredoDesenvolvimento = crypto.randomBytes(32).toString("base64url");
const DURACAO_TOKEN_SEGUNDOS = 4 * 60 * 60;

function obterSegredo() {
  if (config.secretKey) {
    return config.secretKey;
  }
  if (config.isProduction) {
    throw new Error("SECRET_KEY é obrigatória para autenticação em produção.");
  }
  return segredoDesenvolvimento;
}

function assinarToken(usuario, segredo = obterSegredo(), agora = Date.now()) {
  const cabecalho = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const carga = Buffer.from(JSON.stringify({
    sub: String(usuario.id),
    iat: Math.floor(agora / 1000),
    exp: Math.floor(agora / 1000) + DURACAO_TOKEN_SEGUNDOS,
  })).toString("base64url");
  const mensagem = `${cabecalho}.${carga}`;
  const assinatura = crypto.createHmac("sha256", segredo).update(mensagem).digest("base64url");
  return `${mensagem}.${assinatura}`;
}

function verificarToken(token, segredo = obterSegredo(), agora = Date.now()) {
  if (typeof token !== "string") {
    return null;
  }
  const partes = token.split(".");
  if (partes.length !== 3) {
    return null;
  }
  const [cabecalho, carga, assinatura] = partes;
  const mensagem = `${cabecalho}.${carga}`;
  const assinaturaEsperada = crypto.createHmac("sha256", segredo).update(mensagem).digest();
  let assinaturaRecebida;
  let dados;
  try {
    assinaturaRecebida = Buffer.from(assinatura, "base64url");
    const header = JSON.parse(Buffer.from(cabecalho, "base64url").toString("utf8"));
    dados = JSON.parse(Buffer.from(carga, "base64url").toString("utf8"));
    if (header.alg !== "HS256" || header.typ !== "JWT") {
      return null;
    }
  } catch {
    return null;
  }
  if (
    assinaturaRecebida.length !== assinaturaEsperada.length ||
    !crypto.timingSafeEqual(assinaturaRecebida, assinaturaEsperada) ||
    typeof dados.sub !== "string" ||
    !/^[1-9]\d*$/.test(dados.sub) ||
    !Number.isInteger(dados.exp) ||
    dados.exp <= Math.floor(agora / 1000)
  ) {
    return null;
  }
  return { id: dados.sub };
}

module.exports = { assinarToken, verificarToken, obterSegredo, DURACAO_TOKEN_SEGUNDOS };
