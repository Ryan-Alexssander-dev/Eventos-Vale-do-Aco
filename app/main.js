// Ponto de entrada do servidor (Express).
//   npm run dev   -> desenvolvimento (reinicia ao salvar)
//   npm start     -> produção

const path = require("node:path");
const config = require("./config"); // precisa vir primeiro: carrega o .env
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const { paginas, email, usuario, evento } = require("./routers");

const TEMPLATES = path.join(__dirname, "templates");
function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(compression()); // respostas menores = páginas mais rápidas
  // Atrás de proxy (Render, Railway, Nginx...) o Express precisa confiar nele para enxergar HTTPS e o IP real.
  if (config.isProduction) app.set("trust proxy", 1);

  // Cabeçalhos de segurança. A política permite os recursos externos usados pelo site:
  // Bootstrap via jsDelivr e fonte Inter via Google Fonts.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'", "https://cdn.jsdelivr.net"],
          "style-src": ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
          "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
          "img-src": ["'self'", "data:", "blob:"],
          "connect-src": ["'self'"],
          "object-src": ["'none'"],
          "base-uri": ["'self'"],
          "form-action": ["'self'"],
          "frame-ancestors": ["'none'"],
          // Em http://localhost esta diretiva atrapalharia; só faz sentido em produção (HTTPS).
          "upgrade-insecure-requests": config.isProduction ? [] : null,
        },
      },
    })
  );

  // CORS só é necessário se o front-end ficar em outro domínio. Nunca use "*" junto com cookies.
  if (config.corsOrigins.length > 0) {
    app.use("/api", cors({ origin: config.corsOrigins, credentials: true }));
  }

  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));

  // Arquivos estáticos: apenas as pastas abaixo são públicas (nunca a raiz do projeto).
  // CSS e JS são revalidados a cada acesso (sem nome com hash, cache longo mostraria versão antiga após uma atualização);
  // imagens e fontes ficam em cache por mais tempo.
  const opcoesEstaticas = {
    index: false,
    dotfiles: "ignore",
    setHeaders(res, arquivo) {
      const longo = /\.(svg|png|jpe?g|webp|woff2?|ttf)$/i.test(arquivo);
      res.set("Cache-Control", longo && config.isProduction ? "public, max-age=604800" : "no-cache");
    },
  };
  app.use("/static", express.static(path.join(__dirname, "static"), opcoesEstaticas));

  // Verificação de saúde para a hospedagem (não expõe nenhuma informação interna).
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  // Telas HTML
  app.use(paginas);

  // API
  app.use("/api/email", email); // código de verificação e e-mail de inscrição (SMTP do Google)
  app.use("/api/usuarios", usuario); // CRUD de usuários — equipe de back-end
  app.use("/api/eventos", evento); // CRUD de eventos — equipe de back-end
  app.use("/api", (req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

  // Página 404
  app.use((req, res) => {
    res.status(404).sendFile("404.html", { root: TEMPLATES });
  });

  // Tratamento de erros: em produção nunca devolve detalhes técnicos ao navegador.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(`[erro] ${req.method} ${req.path}: ${err.message}`); // não registre corpo da requisição (senhas)
    const status = err.status ?? 500;
    res.status(status).json({ erro: config.isProduction ? "Erro interno do servidor." : err.message });
  });

  return app;
}

if (require.main === module) {
  config.assertProductionConfig(); // em produção, não sobe com configuração insegura

  const app = createApp();
  const server = app.listen(config.port, config.host, () => {
    console.log(`Eventos Vale do Aço rodando em http://${config.host}:${config.port} (${config.env})`);
  });

  const shutdown = () => {
    server.close(() => require("./database").closePool().finally(() => process.exit(0)));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

module.exports = { createApp };
