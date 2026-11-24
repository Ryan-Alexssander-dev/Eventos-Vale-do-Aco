// Limite simples de requisições por IP, em memória (sem dependências).
// Para várias instâncias do servidor, troque por um limitador com armazenamento compartilhado.

function limitarRequisicoes({ janelaMs = 10 * 60 * 1000, maximo = 20 } = {}) {
  const acessos = new Map();

  setInterval(() => {
    const agora = Date.now();
    for (const [ip, dados] of acessos) if (agora > dados.reinicia) acessos.delete(ip);
  }, janelaMs).unref();

  return (req, res, next) => {
    const agora = Date.now();
    const ip = req.ip ?? req.socket?.remoteAddress ?? "desconhecido";
    let dados = acessos.get(ip);
    if (!dados || agora > dados.reinicia) {
      dados = { total: 0, reinicia: agora + janelaMs };
      acessos.set(ip, dados);
    }
    dados.total += 1;
    if (dados.total > maximo) {
      const esperar = Math.ceil((dados.reinicia - agora) / 1000);
      res.set("Retry-After", String(esperar));
      return res.status(429).json({ mensagem: "Muitas tentativas. Aguarde um pouco e tente de novo.", esperarSegundos: esperar });
    }
    return next();
  };
}

module.exports = { limitarRequisicoes };
