// Testes das rotas e serviços de e-mail. Rode com:  npm test
// Não enviam e-mail de verdade: usam um transporte falso.

const test = require("node:test");
const assert = require("node:assert/strict");

const codigos = require("../app/services/codigosVerificacao");
const servicoEmail = require("../app/services/servicoEmail");
const esquema = require("../app/schemas/emailSchema");
const { manipuladores } = require("../app/routers/emailRoutes");

function respostaFalsa() {
  return {
    codigoHttp: 200,
    corpo: null,
    status(codigo) { this.codigoHttp = codigo; return this; },
    json(corpo) { this.corpo = corpo; return this; },
  };
}

function preparar() {
  const enviados = [];
  codigos._registros.clear();
  servicoEmail.definirTransporte({ sendMail: async (mensagem) => enviados.push(mensagem) });
  return enviados;
}

test("emite e confere um código; o token comprova o e-mail", () => {
  const { codigo } = codigos.emitirCodigo("a@b.com", "cadastro");
  assert.match(codigo, /^\d{6}$/);
  const resultado = codigos.conferirCodigo("a@b.com", "cadastro", codigo);
  assert.equal(resultado.ok, true);
  assert.deepEqual(codigos.verificarToken(resultado.tokenVerificacao), { email: "a@b.com", finalidade: "cadastro" });
});

test("código errado é recusado e o código vale uma única vez", () => {
  codigos._registros.clear();
  const { codigo } = codigos.emitirCodigo("c@d.com", "cadastro");
  assert.equal(codigos.conferirCodigo("c@d.com", "cadastro", codigo === "000000" ? "111111" : "000000").ok, false);
  assert.equal(codigos.conferirCodigo("c@d.com", "cadastro", codigo).ok, true);
  assert.equal(codigos.conferirCodigo("c@d.com", "cadastro", codigo).ok, false);
});

test("expira depois de 10 minutos e bloqueia após 5 tentativas", () => {
  codigos._registros.clear();
  const agora = Date.now();
  const { codigo } = codigos.emitirCodigo("e@f.com", "cadastro", agora);
  assert.equal(codigos.conferirCodigo("e@f.com", "cadastro", codigo, agora + 11 * 60 * 1000).ok, false);

  const { codigo: outro } = codigos.emitirCodigo("g@h.com", "cadastro", agora);
  const errado = outro === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i += 1) codigos.conferirCodigo("g@h.com", "cadastro", errado, agora);
  assert.equal(codigos.conferirCodigo("g@h.com", "cadastro", outro, agora).ok, false);
});

test("reenvio só depois de 60s e no máximo 5 por hora", () => {
  codigos._registros.clear();
  const agora = Date.now();
  codigos.emitirCodigo("i@j.com", "cadastro", agora);
  assert.throws(() => codigos.emitirCodigo("i@j.com", "cadastro", agora + 5000), codigos.ErroLimite);
  for (let i = 1; i < 5; i += 1) codigos.emitirCodigo("i@j.com", "cadastro", agora + i * 61000);
  assert.throws(() => codigos.emitirCodigo("i@j.com", "cadastro", agora + 5 * 61000), codigos.ErroLimite);
});

test("token adulterado ou expirado é rejeitado", () => {
  const { tokenVerificacao } = (() => {
    const { codigo } = codigos.emitirCodigo("k@l.com", "recuperacao", Date.now() - 120000);
    return codigos.conferirCodigo("k@l.com", "recuperacao", codigo);
  })();
  const [corpo, assinatura] = tokenVerificacao.split(".");
  const falso = Buffer.from(JSON.stringify({ email: "outro@x.com", finalidade: "recuperacao", exp: Date.now() + 99999 })).toString("base64url");
  assert.equal(codigos.verificarToken(`${falso}.${assinatura}`), null);
  assert.equal(codigos.verificarToken(`${corpo}.${assinatura}`) !== null, true);
  assert.equal(codigos.verificarToken(tokenVerificacao, Date.now() + 16 * 60 * 1000), null);
});

test("validações rejeitam dados inválidos e limpam quebras de linha", () => {
  assert.equal(esquema.validarPedidoCodigo({ email: "ruim", finalidade: "cadastro" }).valido, false);
  assert.equal(esquema.validarPedidoCodigo({ email: "a@b.com", finalidade: "outra" }).valido, false);
  assert.equal(esquema.validarConferenciaCodigo({ email: "a@b.com", finalidade: "cadastro", codigo: "12345" }).valido, false);
  const pedido = esquema.validarPedidoCodigo({ email: "A@B.com", finalidade: "cadastro", nome: "Ana\r\nBcc: x@y.com" });
  assert.equal(pedido.dados.email, "a@b.com");
  assert.equal(/[\r\n]/.test(pedido.dados.nome), false);
});

test("o e-mail escapa HTML vindo dos dados", () => {
  const { html } = servicoEmail.montarEmailInscricao({ nome: "<b>Ana</b>", evento: { titulo: "<script>x</script>", data: "2026-12-05", hora: "19:00", local: "Praça", cidade: "Ipatinga", preco: 45 } });
  assert.equal(html.includes("<script>"), false);
  assert.equal(html.includes("&lt;script&gt;"), true);
});

test("sem SMTP configurado e sem transporte, em desenvolvimento, não envia nem falha", async () => {
  servicoEmail.definirTransporte(null);
  const silencio = console.warn;
  console.warn = () => {};
  const resultado = await servicoEmail.enviarEmail({ para: "a@b.com", assunto: "x", texto: "y" });
  console.warn = silencio;
  assert.equal(resultado.simulado, true);
});

test("rota /codigo envia o e-mail e /verificar devolve o token", async () => {
  const enviados = preparar();
  const res = respostaFalsa();
  await manipuladores.solicitarCodigo({ body: { email: "m@n.com", finalidade: "cadastro", nome: "Maria" } }, res, assert.ifError);
  assert.equal(res.codigoHttp, 200);
  assert.equal(enviados.length, 1);
  const codigo = enviados[0].text.match(/\b\d{6}\b/)[0];

  const ruim = respostaFalsa();
  manipuladores.verificarCodigo({ body: { email: "m@n.com", finalidade: "cadastro", codigo: codigo === "000000" ? "111111" : "000000" } }, ruim);
  assert.equal(ruim.codigoHttp, 400);

  const certo = respostaFalsa();
  manipuladores.verificarCodigo({ body: { email: "m@n.com", finalidade: "cadastro", codigo } }, certo);
  assert.equal(certo.codigoHttp, 200);
  assert.ok(certo.corpo.tokenVerificacao);
});

test("segundo pedido imediato recebe 429; falha no SMTP devolve 502 e libera novo pedido", async () => {
  preparar();
  const corpo = { email: "o@p.com", finalidade: "cadastro" };
  await manipuladores.solicitarCodigo({ body: corpo }, respostaFalsa(), assert.ifError);
  const segundo = respostaFalsa();
  await manipuladores.solicitarCodigo({ body: corpo }, segundo, assert.ifError);
  assert.equal(segundo.codigoHttp, 429);

  codigos._registros.clear();
  servicoEmail.definirTransporte({ sendMail: async () => { throw new Error("falha"); } });
  const silencio = console.error;
  console.error = () => {};
  const falha = respostaFalsa();
  await manipuladores.solicitarCodigo({ body: corpo }, falha, assert.ifError);
  console.error = silencio;
  assert.equal(falha.codigoHttp, 502);
  assert.equal(codigos._registros.size, 0);
});

test("rota /inscricao envia a confirmação e valida o evento", async () => {
  const enviados = preparar();
  const evento = { titulo: "Corrida Ecológica", data: "2026-12-05", hora: "07:30", local: "Praça 1º de Maio", cidade: "Timóteo", preco: 45 };
  const res = respostaFalsa();
  await manipuladores.enviarInscricao({ body: { email: "q@r.com", nome: "Maria", evento } }, res, assert.ifError);
  assert.equal(res.codigoHttp, 200);
  assert.match(enviados[0].subject, /Inscrição confirmada: Corrida Ecológica/);
  assert.match(enviados[0].text, /R\$\s?45,00/);

  const invalida = respostaFalsa();
  await manipuladores.enviarInscricao({ body: { email: "q@r.com", evento: { titulo: "x" } } }, invalida, assert.ifError);
  assert.equal(invalida.codigoHttp, 400);
});
