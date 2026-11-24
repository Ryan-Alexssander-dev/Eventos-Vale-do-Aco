// Rotas de e-mail (montadas em /api/email):
//   POST /codigo     { email, finalidade: "cadastro" | "recuperacao", nome? }  -> envia o código de 6 dígitos
//   POST /verificar  { email, finalidade, codigo }                             -> { tokenVerificacao }
//   POST /inscricao  { email, nome, evento: { titulo, data, hora, local, cidade, preco } } -> e-mail de inscrição

const express = require("express");
const { limitarRequisicoes } = require("../middlewares/limitarRequisicoes");
const { email: esquema } = require("../schemas");
const codigos = require("../services/codigosVerificacao");
const servicoEmail = require("../services/servicoEmail");

const router = express.Router();
const limiteGeral = limitarRequisicoes({ janelaMs: 10 * 60 * 1000, maximo: 30 });

// Limite por destinatário: evita usar o servidor para encher a caixa de entrada de alguém.
const enviosPorDestinatario = new Map();
function dentroDoLimiteDoDestinatario(email, agora = Date.now()) {
  const recentes = (enviosPorDestinatario.get(email) ?? []).filter((momento) => agora - momento < 60 * 60 * 1000);
  if (recentes.length >= 5) {
    return false;
  }
  enviosPorDestinatario.set(email, [...recentes, agora]);
  return true;
}

async function solicitarCodigo(req, res, next) {
  const { valido, dados, mensagem } = esquema.validarPedidoCodigo(req.body);
  if (!valido) {
    return res.status(400).json({ mensagem });
  }
  try {
    const { codigo, minutosValidade } = codigos.emitirCodigo(dados.email, dados.finalidade);
    try {
      await servicoEmail.enviarCodigo({ para: dados.email, nome: dados.nome, codigo, minutos: minutosValidade, finalidade: dados.finalidade });
    } catch {
      codigos.cancelarEmissao(dados.email, dados.finalidade);
      return res.status(502).json({ mensagem: "Não foi possível enviar o e-mail agora. Tente novamente em instantes." });
    }
    return res.json({ ok: true });
  } catch (erro) {
    if (erro instanceof codigos.ErroLimite) {
      return res.status(429).json({ mensagem: erro.message, esperarSegundos: erro.esperarSegundos });
    }
    return next(erro);
  }
}

function verificarCodigo(req, res) {
  const { valido, dados, mensagem } = esquema.validarConferenciaCodigo(req.body);
  if (!valido) {
    return res.status(400).json({ mensagem });
  }
  const resultado = codigos.conferirCodigo(dados.email, dados.finalidade, dados.codigo);
  if (!resultado.ok) {
    return res.status(400).json({ mensagem: resultado.mensagem });
  }
  return res.json({ ok: true, tokenVerificacao: resultado.tokenVerificacao });
}

async function enviarInscricao(req, res, next) {
  const { valido, dados, mensagem } = esquema.validarPedidoInscricao(req.body);
  if (!valido) {
    return res.status(400).json({ mensagem });
  }
  if (!dentroDoLimiteDoDestinatario(dados.email)) {
    return res.status(429).json({ mensagem: "Muitos e-mails enviados para este endereço. Tente novamente mais tarde." });
  }
  try {
    await servicoEmail.enviarConfirmacaoInscricao({ para: dados.email, nome: dados.nome, evento: dados.evento });
    return res.json({ ok: true });
  } catch (erro) {
    if (erro instanceof servicoEmail.ErroEmail) {
      return res.status(502).json({ mensagem: "Não foi possível enviar o e-mail agora." });
    }
    return next(erro);
  }
}

router.post("/codigo", limiteGeral, solicitarCodigo);
router.post("/verificar", limiteGeral, verificarCodigo);
router.post("/inscricao", limiteGeral, enviarInscricao);

module.exports = router;
module.exports.manipuladores = { solicitarCodigo, verificarCodigo, enviarInscricao };
