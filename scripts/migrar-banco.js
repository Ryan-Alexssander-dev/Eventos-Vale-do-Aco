const database = require("../app/database");

async function existeColuna(tabela, coluna) {
  const resultado = await database.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tabela, coluna],
  );
  return resultado.length > 0;
}

async function existeIndiceUnicoEmail() {
  const resultado = await database.query(
    "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'email' AND non_unique = 0 LIMIT 1",
  );
  return resultado.length > 0;
}

async function migrarBanco() {
  await database.query(`
    CREATE TABLE IF NOT EXISTS users (
      id_user INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      senha VARCHAR(255) NOT NULL,
      tipo ENUM('usuario', 'organizador', 'administrador') NOT NULL DEFAULT 'usuario',
      avatar VARCHAR(20) NULL,
      email_verificado TINYINT(1) NOT NULL DEFAULT 0
    ) ENGINE=InnoDB
  `);
  await database.query(`
    CREATE TABLE IF NOT EXISTS eventos (
      id_event INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nomeEvento VARCHAR(200) NOT NULL,
      categoria VARCHAR(20) NOT NULL,
      descricao VARCHAR(255) NOT NULL,
      dataEvento DATE NOT NULL,
      horaEvento TIME NOT NULL,
      cidade VARCHAR(100) NOT NULL,
      endereco VARCHAR(255) NOT NULL,
      precoIngresso DECIMAL(10,2) NOT NULL DEFAULT 0,
      qtdIngresso INT UNSIGNED NULL,
      link VARCHAR(255) NULL,
      capa MEDIUMTEXT NULL,
      id_user INT UNSIGNED NOT NULL,
      id_company INT UNSIGNED NULL,
      criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_eventos_data (dataEvento, horaEvento),
      CONSTRAINT fk_eventos_usuario FOREIGN KEY (id_user)
        REFERENCES users(id_user) ON DELETE RESTRICT
    ) ENGINE=InnoDB
  `);

  const colunasUsuario = [
    ["tipo", "ENUM('usuario', 'organizador', 'administrador') NOT NULL DEFAULT 'usuario'"],
    ["avatar", "VARCHAR(20) NULL"],
    ["email_verificado", "TINYINT(1) NOT NULL DEFAULT 1"],
    ["notificacoes", "JSON NULL"],
    ["cidades_interesse", "JSON NULL"],
  ];
  for (const [coluna, definicao] of colunasUsuario) {
    if (!(await existeColuna("users", coluna))) {
      await database.query(`ALTER TABLE users ADD COLUMN ${coluna} ${definicao}`);
    }
  }
  if (!(await existeIndiceUnicoEmail())) {
    const duplicados = await database.query(
      "SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1 LIMIT 1",
    );
    if (duplicados.length > 0) {
      throw new Error("Há e-mails duplicados em users; corrija-os antes de aplicar o índice único.");
    }
    await database.query("ALTER TABLE users ADD UNIQUE KEY uq_users_email (email)");
  }

  const colunasEvento = [
    ["categoria", "VARCHAR(20) NOT NULL DEFAULT 'comunidade'"],
    ["cidade", "VARCHAR(100) NOT NULL DEFAULT 'Ipatinga'"],
    ["capa", "MEDIUMTEXT NULL"],
    ["link", "VARCHAR(255) NULL"],
    ["id_user", "INT UNSIGNED NULL"],
  ];
  for (const [coluna, definicao] of colunasEvento) {
    if (!(await existeColuna("eventos", coluna))) {
      await database.query(`ALTER TABLE eventos ADD COLUMN ${coluna} ${definicao}`);
    }
  }

  await database.query("ALTER TABLE eventos MODIFY horaEvento TIME NOT NULL");
  await database.query("ALTER TABLE eventos MODIFY link VARCHAR(255) NULL");
  await database.query("ALTER TABLE eventos MODIFY qtdIngresso VARCHAR(255) NULL");
  if (await existeColuna("eventos", "inscricao")) {
    await database.query("ALTER TABLE eventos MODIFY inscricao VARCHAR(255) NULL");
  }
  if (await existeColuna("eventos", "dataPublicacao")) {
    await database.query("ALTER TABLE eventos MODIFY dataPublicacao DATE NULL");
  }

  await database.query(`
    CREATE TABLE IF NOT EXISTS eventos_salvos (
      id_user INT UNSIGNED NOT NULL,
      id_event INT UNSIGNED NOT NULL,
      salvo_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_user, id_event),
      CONSTRAINT fk_eventos_salvos_usuario FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
      CONSTRAINT fk_eventos_salvos_evento FOREIGN KEY (id_event) REFERENCES eventos(id_event) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  await database.query(`
    CREATE TABLE IF NOT EXISTS inscricoes (
      id_user INT UNSIGNED NOT NULL,
      id_event INT UNSIGNED NOT NULL,
      criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_user, id_event),
      CONSTRAINT fk_inscricoes_usuario FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE,
      CONSTRAINT fk_inscricoes_evento FOREIGN KEY (id_event) REFERENCES eventos(id_event) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log("Banco migrado. As contas existentes foram preservadas.");
}

migrarBanco()
  .catch((error) => {
    console.error(`Não foi possível migrar o banco: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => database.closePool());
