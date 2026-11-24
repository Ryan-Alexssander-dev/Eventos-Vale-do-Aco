const database = require("../database");
const { verificarToken, obterSegredo } = require("../services/tokensAcesso");

function criarAutenticacao({ query = database.query, segredo = obterSegredo() } = {}) {
  async function exigirUsuario(req, res, next) {
    const cabecalho = req.get("authorization") ?? "";
    const correspondencia = cabecalho.match(/^Bearer\s+(.+)$/i);
    const dadosToken = correspondencia && verificarToken(correspondencia[1], segredo);
    if (!dadosToken) {
      return res.status(401).json({ mensagem: "Faça login para continuar." });
    }

    try {
      const usuarios = await query(
        "SELECT id_user AS id, nome, email, tipo, avatar, email_verificado AS emailVerificado FROM users WHERE id_user = ?",
        [dadosToken.id],
      );
      if (usuarios.length === 0) {
        return res.status(401).json({ mensagem: "Sua sessão expirou. Entre novamente." });
      }
      const usuario = usuarios[0];
      usuario.emailVerificado = Boolean(usuario.emailVerificado);
      req.usuario = usuario;
      return next();
    } catch (error) {
      return next(error);
    }
  }

  function exigirAdministrador(req, res, next) {
    if (req.usuario?.tipo !== "administrador") {
      return res.status(403).json({ mensagem: "Apenas administradores podem gerenciar eventos." });
    }
    return next();
  }

  return { exigirUsuario, exigirAdministrador };
}

module.exports = { criarAutenticacao };
