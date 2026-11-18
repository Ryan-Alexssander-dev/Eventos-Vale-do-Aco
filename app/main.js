// Ponto de entrada do servidor JavaScript da aplicação.

const http = require("node:http");

const hostname = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Eventos Vale do Aço");
});

if (require.main === module) {
  server.listen(port, hostname, () => {
    console.log(`Servidor disponível em http://${hostname}:${port}`);
  });
}

module.exports = server;