// Carrega e disponibiliza as configurações do ambiente.

function getSetting(name, defaultValue = "") {
  return process.env[name] ?? defaultValue;
}

module.exports = { getSetting };