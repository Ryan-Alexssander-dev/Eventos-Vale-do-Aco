// CRUD de usuários (montado em /api/usuarios).

const express = require("express");
const bcrypt = require("bcrypt");
const { query } = require("../database");

const router = express.Router();
const saltRounds = 10;

function emailValido(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function idValido(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.post("/login", async (req, res, next) => {
  const { email, senha } = req.body;
  if (!emailValido(email) || typeof senha !== "string" || senha.length === 0) {
    return res.status(400).json({ mensagem: "E-mail e senha válidos são obrigatórios." });
  }

  try {
    const usuarios = await query(
      "SELECT id_user, nome, email, senha FROM users WHERE email = ?",
      [email]
    );
    const usuario = usuarios[0];
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
    }

    return res.json({
      usuario: { id: usuario.id_user, nome: usuario.nome, email: usuario.email },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const { nome, email, senha } = req.body;
  if (typeof nome !== "string" || !nome.trim() || !emailValido(email) ||
      typeof senha !== "string" || !senha.trim()) {
    return res.status(400).json({ mensagem: "Nome, e-mail e senha válidos são obrigatórios." });
  }

  try {
    const existentes = await query("SELECT id_user FROM users WHERE email = ?", [email]);
    if (existentes.length > 0) {
      return res.status(409).json({ mensagem: "E-mail já está em uso." });
    }

    const hash = await bcrypt.hash(senha, saltRounds);
    const resultado = await query(
      "INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)",
      [nome.trim(), email, hash]
    );
    return res.status(201).json({
      usuario: { id: resultado.insertId, nome: nome.trim(), email },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const usuarios = req.query.email
      ? await query("SELECT id_user AS id, nome, email FROM users WHERE email = ?", [req.query.email])
      : await query("SELECT id_user AS id, nome, email FROM users ORDER BY nome");
    return res.json(usuarios);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) {
    return res.status(400).json({ mensagem: "Informe um ID válido." });
  }

  try {
    const usuarios = await query(
      "SELECT id_user AS id, nome, email FROM users WHERE id_user = ?",
      [id]
    );
    if (usuarios.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }
    return res.json(usuarios[0]);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  const id = idValido(req.params.id);
  const { nome, email, senha } = req.body;
  if (!id) {
    return res.status(400).json({ mensagem: "Informe um ID válido." });
  }
  if (typeof nome !== "string" || !nome.trim() || !emailValido(email) ||
      typeof senha !== "string" || !senha.trim()) {
    return res.status(400).json({ mensagem: "Nome, e-mail e senha válidos são obrigatórios." });
  }

  try {
    const usuarios = await query("SELECT id_user FROM users WHERE id_user = ?", [id]);
    if (usuarios.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }

    const hash = await bcrypt.hash(senha, saltRounds);
    await query("UPDATE users SET nome = ?, email = ?, senha = ? WHERE id_user = ?", [
      nome.trim(),
      email,
      hash,
      id,
    ]);
    return res.json({ usuario: { id, nome: nome.trim(), email } });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = idValido(req.params.id);
  if (!id) {
    return res.status(400).json({ mensagem: "Informe um ID válido." });
  }

  try {
    const resultado = await query("DELETE FROM users WHERE id_user = ?", [id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
