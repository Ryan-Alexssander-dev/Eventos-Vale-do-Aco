const bcrypt = require("bcrypt");
const database = require("../app/database");

async function criarAdministrador() {
  const nome = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.ADMIN_PASSWORD;
  if (!nome || nome.length > 50 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "") || !senha || senha.length < 12) {
    throw new Error("Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD (mínimo de 12 caracteres) no .env.");
  }

  const existentes = await database.query("SELECT id_user FROM users WHERE email = ?", [email]);
  if (existentes.length > 0) {
    throw new Error("Esse e-mail já possui uma conta. A conta existente não foi alterada.");
  }

  const hash = await bcrypt.hash(senha, 12);
  const resultado = await database.query(
    "INSERT INTO users (nome, email, senha, tipo, email_verificado) VALUES (?, ?, ?, 'administrador', 1)",
    [nome, email, hash],
  );
  console.log(`Administrador criado (ID ${resultado.insertId}, ${email}). Remova ADMIN_PASSWORD do .env após o uso.`);
}

criarAdministrador()
  .catch((error) => {
    console.error(`Não foi possível criar o administrador: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => database.closePool());
