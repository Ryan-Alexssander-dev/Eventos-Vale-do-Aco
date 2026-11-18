// Centraliza a configuração e o ciclo de vida da conexão MySQL.

module.exports = {
  async getConnection() {
    throw new Error("Configure o driver MySQL antes de abrir uma conexão.");
  },
};