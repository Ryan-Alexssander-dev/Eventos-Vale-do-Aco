const express = require("express");
const bcrypt = require("bcrypt");
const database = require("../database");
const { assinarToken, obterSegredo } = require("../services/tokensAcesso");
const { criarAutenticacao } = require("../middlewares/autenticacao");
const { limitarRequisicoes } = require("../middlewares/limitarRequisicoes");

const HASH_DUMMY = bcrypt.hash("senha-inexistente-para-equalizar-login", 12);
const limitarLogin = limitarRequisicoes({ janelaMs: 15 * 60 * 1000, maximo: 10 });

function criarUsuarioRoutes({ query = database.query, segredo = obterSegredo() } = {}) {
  const router = express.Router();
  const { exigirUsuario } = criarAutenticacao({ query, segredo });

  router.post("/login", limitarLogin, async (req, res, next) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const senha = req.body?.senha;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof senha !== "string" || senha.length === 0) {
      return res.status(400).json({ mensagem: "Informe um e-mail e uma senha válidos." });
    }

    try {
      const usuarios = await query(
        "SELECT id_user AS id, nome, email, senha, tipo, avatar, email_verificado AS emailVerificado FROM users WHERE email = ?",
        [email],
      );
      const usuario = usuarios[0];
      const hash = usuario?.senha ?? await HASH_DUMMY;
      const senhaCorreta = await bcrypt.compare(senha, hash);
      if (!usuario || !senhaCorreta) {
        return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
      }

      const usuarioPublico = {
        id: String(usuario.id),
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo ?? "usuario",
        avatar: usuario.avatar ?? "",
        emailVerificado: Boolean(usuario.emailVerificado),
      };
      return res.json({ usuario: usuarioPublico, token: assinarToken(usuarioPublico, segredo) });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/me", exigirUsuario, (req, res) => res.json({ usuario: req.usuario }));

  return router;
}

module.exports = criarUsuarioRoutes();
module.exports.criarUsuarioRoutes = criarUsuarioRoutes;
