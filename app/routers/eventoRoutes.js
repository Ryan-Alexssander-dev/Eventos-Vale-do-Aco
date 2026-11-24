// CRUD de eventos (montado em /api/eventos) — a ser implementado pela equipe de back-end.
//
// O front-end (app/static/js/servicoEventos.js) espera, ajustáveis em app/static/js/configuracao.js:
//   GET    /            lista de eventos (todos, o front filtra)
//   GET    /:id         um evento
//   POST   /            cria evento (JSON ou multipart quando há imagem de capa) — somente administrador
//   PATCH  /:id         atualiza — somente administrador
//   DELETE /:id         exclui — somente administrador
//   POST   /:idEvento/inscricoes   { idUsuario }  registra inscrição
// Detalhes em docs/CONTRATO-DA-API.md.

const express = require("express");

const router = express.Router();

module.exports = router;
