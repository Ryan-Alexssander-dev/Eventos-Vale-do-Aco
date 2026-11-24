// Reúne os roteadores para o main.js importar tudo de uma vez.

module.exports = {
  paginas: require("./paginasRoutes"),
  email: require("./emailRoutes"),
  usuario: require("./usuarioRoutes"),
  evento: require("./eventoRoutes"),
};
