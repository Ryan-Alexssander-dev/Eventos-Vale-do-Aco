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
  host: getSetting("HOST", env === "production" ? "0.0.0.0" : "127.0.0.1"),
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
    connectionLimit: Number(getSetting("MYSQL_CONNECTION_LIMIT", "10")),
    ssl: getSetting("MYSQL_SSL") === "true",
  },
  supabase: {
    url: getSetting("SUPABASE_URL"),
    serviceRoleKey: getSetting("SUPABASE_SERVICE_ROLE_KEY"),
    bucket: getSetting("SUPABASE_BUCKET_EVENTOS", "event-covers"),
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
  for (const key of ["host", "database", "user", "password"]) {
    if (looksLikePlaceholder(config.mysql[key])) {
      problems.push(`MYSQL_${key.toUpperCase()} ausente ou de exemplo`);
    }
  }
  if (["localhost", "127.0.0.1", "::1"].includes(config.mysql.host.toLowerCase())) {
    problems.push("MYSQL_HOST deve apontar para o banco remoto da hospedagem");
  }
  if (!Number.isInteger(config.mysql.port) || config.mysql.port < 1 || config.mysql.port > 65535) {
    problems.push("MYSQL_PORT inválida");
  }
  if (!Number.isInteger(config.mysql.connectionLimit) || config.mysql.connectionLimit < 1) {
    problems.push("MYSQL_CONNECTION_LIMIT inválida");
  }
  if (looksLikePlaceholder(config.supabase.url)) {
    problems.push("SUPABASE_URL ausente ou de exemplo");
  } else {
    try {
      const supabaseUrl = new URL(config.supabase.url);
      if (supabaseUrl.protocol !== "https:") {
        problems.push("SUPABASE_URL deve usar HTTPS");
      }
    } catch {
      problems.push("SUPABASE_URL inválida");
    }
  }
  if (looksLikePlaceholder(config.supabase.serviceRoleKey)) {
    problems.push("SUPABASE_SERVICE_ROLE_KEY ausente ou de exemplo");
  }
  if (looksLikePlaceholder(config.supabase.bucket)) {
    problems.push("SUPABASE_BUCKET_EVENTOS ausente ou de exemplo");
  }
  for (const key of ["username", "password"]) {
    if (looksLikePlaceholder(config.smtp[key])) {
      problems.push(`SMTP_${key.toUpperCase()} ausente ou de exemplo`);
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
