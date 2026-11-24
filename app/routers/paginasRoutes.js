// Entrega as telas HTML (app/templates). Só as rotas listadas aqui existem:
// o servidor nunca monta caminho de arquivo a partir da URL.
//
// As telas são arquivos estáticos sem dados pessoais. Quem pode VER ou ALTERAR dados é decidido pela API
// (e, no navegador, por app/static/js/interface.js — apenas por conforto de navegação).

const path = require("node:path");
const express = require("express");

const TEMPLATES = path.join(__dirname, "..", "templates");
const router = express.Router();

const paginas = {
  "/": "index.html",
  "/login": "login.html",
  "/cadastro": "cadastro.html",
  "/cadastro/usuario": "cadastrarUsuario.html",
  "/cadastro/organizador": "cadastrarOrganizador.html",
  "/verificar-email": "verificarEmail.html",
  "/recuperar-senha": "recuperarSenha.html",
  "/home": "home.html",
  "/eventos-salvos": "eventosSalvos.html",
  "/perfil": "perfil.html",
  "/configuracoes": "configuracoes.html",
  "/pagamento": "pagamento.html",
  "/inscricao-confirmada": "inscricaoConfirmada.html",
  "/admin": "admin.html",
  "/publicar-evento": "cadastrarEvento.html",
  "/termos": "termos.html",
  "/privacidade": "privacidade.html",
  "/cookies": "cookies.html",
};

for (const [rota, arquivo] of Object.entries(paginas)) {
  router.get(rota, (req, res) => {
    res.set("Cache-Control", "no-cache");
    res.sendFile(arquivo, { root: TEMPLATES });
  });
}

module.exports = router;
