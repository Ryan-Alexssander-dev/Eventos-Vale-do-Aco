const express = require("express");
const bcrypt = require("bcrypt");
const database = require("../database");
const { assinarToken, obterSegredo } = require("../services/tokensAcesso");
const { criarAutenticacao } = require("../middlewares/autenticacao");
const { limitarRequisicoes } = require("../middlewares/limitarRequisicoes");
const { verificarToken: verificarTokenDeCodigo } = require("../services/codigosVerificacao");

const HASH_DUMMY = bcrypt.hash("senha-inexistente-para-equalizar-login", 12);
const limitarLogin = limitarRequisicoes({ janelaMs: 15 * 60 * 1000, maximo: 10 });
const TIPOS_PUBLICOS = new Set(["usuario", "organizador"]);
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizarUsuarioPublico(linha) {
  let notificacoes = linha.notificacoes;
  if (typeof notificacoes === "string") {
    try { notificacoes = JSON.parse(notificacoes); } catch { notificacoes = null; }
  }
  let cidadesInteresse = linha.cidadesInteresse ?? linha.cidades_interesse;
  if (typeof cidadesInteresse === "string") {
    try { cidadesInteresse = JSON.parse(cidadesInteresse); } catch { cidadesInteresse = []; }
  }
  return {
    id: String(linha.id),
    nome: linha.nome,
    email: linha.email,
    tipo: linha.tipo ?? "usuario",
    avatar: linha.avatar ?? "",
    emailVerificado: Boolean(linha.emailVerificado),
    notificacoes: notificacoes ?? { lembrete: true, novosEventos: true, avisos: true },
    cidadesInteresse: Array.isArray(cidadesInteresse) ? cidadesInteresse : [],
  };
}

function validarSenha(senha) {
  return typeof senha === "string" && senha.length >= 8 &&
    senha.length <= 255 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
}

function criarUsuarioRoutes({ query = database.query, segredo = obterSegredo() } = {}) {
  const router = express.Router();
  const { exigirUsuario } = criarAutenticacao({ query, segredo });

  router.post("/login", limitarLogin, async (req, res, next) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const senha = req.body?.senha;
    if (!EMAIL_VALIDO.test(email) || typeof senha !== "string" || senha.length === 0) {
      return res.status(400).json({ mensagem: "Informe um e-mail e uma senha válidos." });
    }

    try {
      const usuarios = await query(
        "SELECT id_user AS id, nome, email, senha, tipo, avatar, email_verificado AS emailVerificado, notificacoes, cidades_interesse AS cidadesInteresse FROM users WHERE email = ?",
        [email],
      );
      const usuario = usuarios[0];
      const hash = usuario?.senha ?? await HASH_DUMMY;
      const senhaCorreta = await bcrypt.compare(senha, hash);
      if (!usuario || !senhaCorreta) {
        return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
      }

      const usuarioPublico = normalizarUsuarioPublico(usuario);
      return res.json({ usuario: usuarioPublico, token: assinarToken(usuarioPublico, segredo) });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/me", exigirUsuario, (req, res) => res.json({ usuario: req.usuario }));

  router.post("/", async (req, res, next) => {
    const nome = String(req.body?.nome ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const senha = req.body?.senha;
    const tipo = req.body?.tipo ?? "usuario";
    const avatar = String(req.body?.avatar ?? "").trim();

    if (!nome || nome.length > 50 || !EMAIL_VALIDO.test(email) || !validarSenha(senha) ||
        (tipo && !TIPOS_PUBLICOS.has(tipo)) || avatar.length > 20) {
      return res.status(400).json({ mensagem: "Confira os dados informados para o cadastro." });
    }
    try {
      const hash = await bcrypt.hash(senha, 12);
      const resultado = await query(
        "INSERT INTO users (nome, email, senha, tipo, avatar, email_verificado) VALUES (?, ?, ?, 'usuario', ?, 0)",
        [nome, email, hash, avatar || null],
      );
      const linhas = await query(
        "SELECT id_user AS id, nome, email, tipo, avatar, email_verificado AS emailVerificado, notificacoes, cidades_interesse AS cidadesInteresse FROM users WHERE id_user = ?",
        [resultado.insertId],
      );
      return res.status(201).json({ usuario: normalizarUsuarioPublico(linhas[0]) });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ mensagem: "Este e-mail já está cadastrado." });
      }
      return next(error);
    }
  });

  router.get("/", async (req, res, next) => {
    const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
    if (email) {
      if (!EMAIL_VALIDO.test(email)) {
        return res.status(400).json({ mensagem: "Informe um e-mail válido." });
      }
      try {
        const linhas = await query(
          "SELECT id_user AS id, nome, email, tipo, avatar, email_verificado AS emailVerificado, notificacoes, cidades_interesse AS cidadesInteresse FROM users WHERE email = ?",
          [email],
        );
        if (linhas.length === 0) {
          return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }
        return res.json(linhas.map(normalizarUsuarioPublico));
      } catch (error) {
        return next(error);
      }
    }
    try {
      const linhas = await query(
        "SELECT id_user AS id, nome, email, tipo, avatar, email_verificado AS emailVerificado, notificacoes, cidades_interesse AS cidadesInteresse FROM users",
      );
      return res.json(linhas.map(normalizarUsuarioPublico));
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ mensagem: "Informe um ID de usuário válido." });
    }
    try {
      const linhas = await query(
        "SELECT id_user AS id, nome, email, tipo, avatar, email_verificado AS emailVerificado, notificacoes, cidades_interesse AS cidadesInteresse FROM users WHERE id_user = ?",
        [req.params.id],
      );
      return linhas[0]
        ? res.json({ usuario: normalizarUsuarioPublico(linhas[0]) })
        : res.status(404).json({ mensagem: "Usuário não encontrado." });
    } catch (error) {
      return next(error);
    }
  });

  const atualizarUsuario = async (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ mensagem: "Informe um ID de usuário válido." });
    }
    if (String(req.usuario.id) !== req.params.id) {
      return res.status(403).json({ mensagem: "Você só pode alterar os próprios dados." });
    }
    try {
      const linhas = await query(
        "SELECT id_user AS id, nome, email, senha, tipo, avatar, email_verificado AS emailVerificado, notificacoes, cidades_interesse AS cidadesInteresse FROM users WHERE id_user = ?",
        [req.params.id],
      );
      const atual = linhas[0];
      if (!atual) return res.status(404).json({ mensagem: "Usuário não encontrado." });

      if (req.body?.senhaAtual !== undefined || req.body?.novaSenha !== undefined) {
        if (!req.body.senhaAtual || !req.body.novaSenha ||
            !(await bcrypt.compare(req.body.senhaAtual, atual.senha))) {
          return res.status(403).json({ mensagem: "A senha atual está incorreta." });
        }
        if (!validarSenha(req.body.novaSenha)) {
          return res.status(400).json({ mensagem: "A nova senha deve ter letras, números e pelo menos 8 caracteres." });
        }
        await query("UPDATE users SET senha = ? WHERE id_user = ?", [await bcrypt.hash(req.body.novaSenha, 12), req.params.id]);
      }

      if (req.body?.novaSenha !== undefined && req.body?.senhaAtual === undefined) {
        const dadosToken = verificarTokenDeCodigo(req.body.tokenVerificacao);
        if (!dadosToken || dadosToken.email !== atual.email || dadosToken.finalidade !== "recuperacao") {
          return res.status(400).json({ mensagem: "Token de recuperação inválido." });
        }
        if (!validarSenha(req.body.novaSenha)) {
          return res.status(400).json({ mensagem: "A nova senha deve ter letras, números e pelo menos 8 caracteres." });
        }
        await query("UPDATE users SET senha = ? WHERE id_user = ?", [await bcrypt.hash(req.body.novaSenha, 12), req.params.id]);
      }

      if (req.body?.emailVerificado === true) {
        const dadosToken = verificarTokenDeCodigo(req.body.tokenVerificacao);
        if (!dadosToken || dadosToken.email !== atual.email || dadosToken.finalidade !== "cadastro") {
          return res.status(400).json({ mensagem: "Token de confirmação inválido." });
        }
        await query("UPDATE users SET email_verificado = 1 WHERE id_user = ?", [req.params.id]);
      }

      if (req.body?.notificacoes !== undefined) {
        await query("UPDATE users SET notificacoes = ? WHERE id_user = ?", [
          JSON.stringify(req.body.notificacoes),
          req.params.id,
        ]);
      }
      if (req.body?.cidadesInteresse !== undefined) {
        if (!Array.isArray(req.body.cidadesInteresse)) {
          return res.status(400).json({ mensagem: "Cidades de interesse devem ser uma lista." });
        }
        await query("UPDATE users SET cidades_interesse = ? WHERE id_user = ?", [
          JSON.stringify(req.body.cidadesInteresse),
          req.params.id,
        ]);
      }

      const nome = req.body?.nome !== undefined ? String(req.body.nome).trim() : atual.nome;
      const avatar = req.body?.avatar !== undefined ? String(req.body.avatar).trim() : (atual.avatar ?? "");
      if (!nome || nome.length > 50 || avatar.length > 20) {
        return res.status(400).json({ mensagem: "Confira o nome ou o avatar informado." });
      }
      await query("UPDATE users SET nome = ?, avatar = ? WHERE id_user = ?", [nome, avatar || null, req.params.id]);

      const atualizadas = await query(
        "SELECT id_user AS id, nome, email, tipo, avatar, email_verificado AS emailVerificado, notificacoes, cidades_interesse AS cidadesInteresse FROM users WHERE id_user = ?",
        [req.params.id],
      );
      return res.json({ usuario: normalizarUsuarioPublico(atualizadas[0]) });
    } catch (error) {
      return next(error);
    }
  };

  router.patch("/:id", exigirUsuario, atualizarUsuario);
  router.put("/:id", exigirUsuario, atualizarUsuario);

  router.delete("/:id", exigirUsuario, async (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ mensagem: "Informe um ID de usuário válido." });
    }
    if (String(req.usuario.id) !== req.params.id) {
      return res.status(403).json({ mensagem: "Você só pode excluir a própria conta." });
    }
    if (typeof req.body?.senha !== "string") {
      return res.status(400).json({ mensagem: "Informe a senha da conta." });
    }
    try {
      const linhas = await query("SELECT senha FROM users WHERE id_user = ?", [req.params.id]);
      if (linhas.length === 0) return res.status(404).json({ mensagem: "Usuário não encontrado." });
      if (!(await bcrypt.compare(req.body.senha, linhas[0].senha))) {
        return res.status(403).json({ mensagem: "A senha está incorreta." });
      }
      await query("DELETE FROM users WHERE id_user = ?", [req.params.id]);
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:idUsuario/eventos-salvos", exigirUsuario, async (req, res, next) => {
    if (String(req.usuario.id) !== req.params.idUsuario) {
      return res.status(403).json({ mensagem: "Acesso negado aos eventos salvos." });
    }
    try {
      const linhas = await query(`
        SELECT e.id_event AS id, e.nomeEvento AS titulo, e.categoria, e.descricao,
          DATE_FORMAT(e.dataEvento, '%Y-%m-%d') AS data, DATE_FORMAT(e.horaEvento, '%H:%i') AS hora,
          e.cidade, e.endereco AS local, e.precoIngresso AS preco, e.qtdIngresso AS vagas,
          e.link, e.capa, e.id_user, u.tipo AS publicadorTipo, u.nome AS publicadorNome, u.avatar AS publicadorAvatar
        FROM eventos_salvos s JOIN eventos e ON e.id_event = s.id_event
        LEFT JOIN users u ON u.id_user = e.id_user
        WHERE s.id_user = ? ORDER BY e.dataEvento, e.horaEvento
      `, [req.params.idUsuario]);
      return res.json(linhas.map((linha) => ({
        id: String(linha.id), titulo: linha.titulo, categoria: linha.categoria,
        descricao: linha.descricao, data: linha.data, hora: linha.hora, cidade: linha.cidade,
        local: linha.local, preco: Number(linha.preco), vagas: linha.vagas, link: linha.link ?? "",
        capa: linha.capa ?? "", publicador: {
          tipo: linha.publicadorTipo ?? "administrador",
          nome: linha.publicadorTipo === "administrador" ? "" : (linha.publicadorNome ?? ""),
          avatar: linha.publicadorAvatar ?? "",
        },
      })));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:idUsuario/eventos-salvos", exigirUsuario, async (req, res, next) => {
    if (String(req.usuario.id) !== req.params.idUsuario) {
      return res.status(403).json({ mensagem: "Acesso negado aos eventos salvos." });
    }
    const idEvento = req.body?.idEvento;
    if (!/^[1-9]\d*$/.test(String(idEvento ?? ""))) {
      return res.status(400).json({ mensagem: "Informe um ID de evento válido." });
    }
    try {
      await query("INSERT IGNORE INTO eventos_salvos (id_user, id_event) VALUES (?, ?)", [req.params.idUsuario, idEvento]);
      return res.status(201).json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:idUsuario/eventos-salvos/:idEvento", exigirUsuario, async (req, res, next) => {
    if (String(req.usuario.id) !== req.params.idUsuario) {
      return res.status(403).json({ mensagem: "Acesso negado aos eventos salvos." });
    }
    try {
      await query("DELETE FROM eventos_salvos WHERE id_user = ? AND id_event = ?", [req.params.idUsuario, req.params.idEvento]);
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = criarUsuarioRoutes();
module.exports.criarUsuarioRoutes = criarUsuarioRoutes;
