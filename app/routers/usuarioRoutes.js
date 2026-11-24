// CRUD de usuários (montado em /api/usuarios) — a ser implementado pela equipe de back-end.
//
// O front-end (app/static/js/servicoUsuarios.js) espera, ajustáveis em app/static/js/configuracao.js:
//   POST   /login                       { email, senha }  -> { usuario, token? }
//   POST   /                            cria usuário      -> usuario
//   GET    /?email=...                  busca por e-mail  -> lista ou usuario
//   GET    /:id        PATCH /:id       lê / atualiza     -> usuario
//   DELETE /:id                         { senha }
//   GET|POST /:idUsuario/eventos-salvos  e  DELETE /:idUsuario/eventos-salvos/:idEvento
// Detalhes em docs/CONTRATO-DA-API.md.
//
// Para validar o token devolvido pela verificação de e-mail (campo tokenVerificacao nas rotas de cadastro e
// de redefinição de senha), use verificarToken() de ../services/codigosVerificacao.js.

const express = require("express");

const router = express.Router();

module.exports = router;
