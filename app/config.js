// Configurações da aplicação. É o ÚNICO arquivo que lê o .env.
// Os demais módulos usam: const config = require("./config");

require("dotenv").config({ quiet: true });

const env = process.env.NODE_ENV ?? process.env.APP_ENV ?? "development";
process.env.NODE_ENV = env; // o Express lê NODE_ENV para decidir modo de produção

function getSetting(name, defaultValue = "") {
  return process.env[name] ?? defaultValue;
}

const config = {
  env,
  isProduction: env === "production",
  host: getSetting("HOST", "127.0.0.1"),
  port: Number(getSetting("PORT", "3000")),
  secretKey: getSetting("SECRET_KEY"),
  // Origens autorizadas a chamar a API de outro domínio (separadas por vírgula). Vazio = só o próprio site.
  corsOrigins: getSetting("CORS_ORIGIN")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  mysql: {
    host: getSetting("MYSQL_HOST", "127.0.0.1"),
    port: Number(getSetting("MYSQL_PORT", "3306")),
    database: getSetting("MYSQL_DATABASE"),
    user: getSetting("MYSQL_USER"),
    password: getSetting("MYSQL_PASSWORD"),
    ssl: getSetting("MYSQL_SSL") === "true",
  },
  // SMTP do Google (Gmail). A senha deve ser uma "senha de app" (exige verificação em duas etapas na conta).
  smtp: {
    host: getSetting("SMTP_HOST", "smtp.gmail.com"),
    port: Number(getSetting("SMTP_PORT", "465")),
    secure: getSetting("SMTP_SECURE", "true") === "true", // true = porta 465 (TLS direto)
    username: getSetting("SMTP_USERNAME"),
    password: getSetting("SMTP_PASSWORD"),
    from: getSetting("SMTP_FROM"), // ex.: Eventos Vale do Aço <seuemail@gmail.com>
  },
};

const PLACEHOLDERS = ["troque", "gere-uma", "seu_usuario", "change-me", "changeme"];
const looksLikePlaceholder = (value) =>
  !value || PLACEHOLDERS.some((p) => value.toLowerCase().includes(p));

// Chamada na inicialização. Em produção, o servidor se recusa a subir com configuração insegura.
// (Mostra só o NOME da variável com problema — nunca o valor.)
function assertProductionConfig() {
  if (!config.isProduction) {
    return;
  }

  const problems = [];
  if (looksLikePlaceholder(config.secretKey) || config.secretKey.length < 32) {
    problems.push("SECRET_KEY ausente, de exemplo ou com menos de 32 caracteres");
  }
  for (const key of ["database", "user", "password"]) {
    if (looksLikePlaceholder(config.mysql[key])) {
      problems.push(`MYSQL_${key.toUpperCase()} ausente ou de exemplo`);
    }
  }
  if (config.corsOrigins.includes("*")) {
    problems.push("CORS_ORIGIN=* não é permitido");
  }

  if (problems.length > 0) {
    throw new Error(`Configuração insegura para produção:\n - ${problems.join("\n - ")}`);
  }
}

module.exports = { ...config, getSetting, assertProductionConfig };
