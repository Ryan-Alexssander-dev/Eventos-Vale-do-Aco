// Conexão com o MySQL (pool). O pool só é criado na primeira consulta,
// então importar este arquivo não exige o banco configurado.

const mysql = require("mysql2/promise");
const config = require("./config");

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.mysql.host,
      port: config.mysql.port,
      database: config.mysql.database,
      user: config.mysql.user,
      password: config.mysql.password,
      charset: "utf8mb4",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: false,
      ssl: config.mysql.ssl ? { rejectUnauthorized: true } : undefined,
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function getConnection() {
  return getPool().getConnection();
}

async function testConnection() {
  const connection = await getPool().getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

module.exports = { query, getConnection, testConnection, closePool };
