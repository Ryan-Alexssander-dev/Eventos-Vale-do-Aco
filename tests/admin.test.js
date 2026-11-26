const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const bcrypt = require("bcrypt");

const { assinarToken, verificarToken } = require("../app/services/tokensAcesso");
const { criarUsuarioRoutes } = require("../app/routers/usuarioRoutes");
const { criarEventoRoutes } = require("../app/routers/eventoRoutes");
const { createApp } = require("../app/main");

async function iniciarServidor(t, app) {
  const servidor = app.listen(0, "127.0.0.1");
  await once(servidor, "listening");
  t.after(() => new Promise((resolve) => {
    servidor.closeAllConnections();
    servidor.close(resolve);
  }));
  return `http://127.0.0.1:${servidor.address().port}`;
}

test("token de acesso rejeita adulteração e expiração", () => {
  const segredo = "chave-de-teste-com-tamanho-suficiente";
  const token = assinarToken({ id: "42" }, segredo, 1_000_000);
  assert.deepEqual(verificarToken(token, segredo, 1_001_000), { id: "42" });
  assert.equal(verificarToken(`${token.slice(0, -1)}x`, segredo, 1_001_000), null);
  assert.equal(verificarToken(token, segredo, 20_000_000), null);
});

test("login permite contas sem e-mail verificado e nunca expõe o hash da senha", async (t) => {
  const segredo = "chave-de-teste-com-tamanho-suficiente";
  const hash = await bcrypt.hash("SenhaSegura123", 4);
  const query = async (sql) => {
    assert.match(sql, /FROM users WHERE email = \?/);
    return [{
      id: 8,
      nome: "Admin",
      email: "admin@exemplo.com",
      senha: hash,
      tipo: "administrador",
      avatar: null,
      emailVerificado: 0,
    }];
  };
  const app = express();
  app.use(express.json());
  app.use("/api/usuarios", criarUsuarioRoutes({ query, segredo }));
  const base = await iniciarServidor(t, app);

  const resposta = await fetch(`${base}/api/usuarios/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "ADMIN@EXEMPLO.COM", senha: "SenhaSegura123" }),
  });
  const dados = await resposta.json();
  assert.equal(resposta.status, 200);
  assert.equal(dados.usuario.tipo, "administrador");
  assert.equal("senha" in dados.usuario, false);
  assert.deepEqual(verificarToken(dados.token, segredo).id, "8");
});

test("cadastro cria uma conta sem exigir verificação por e-mail", async (t) => {
  let conta;
  const query = async (sql, params = []) => {
    if (sql.startsWith("INSERT INTO users")) {
      conta = {
        id: 17,
        nome: params[0],
        email: params[1],
        tipo: "usuario",
        avatar: params[3],
        senha: params[2],
        emailVerificado: 0,
      };
      return { insertId: conta.id };
    }
    if (sql.includes("FROM users WHERE id_user = ?")) {
      assert.equal(params[0], conta.id);
      return [conta];
    }
    throw new Error(`Consulta inesperada: ${sql}`);
  };
  const app = express();
  app.use(express.json());
  app.use("/api/usuarios", criarUsuarioRoutes({ query }));
  const base = await iniciarServidor(t, app);

  const resposta = await fetch(`${base}/api/usuarios`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      nome: "Participante",
      email: "participante@exemplo.com",
      senha: "SenhaSegura123",
      avatar: "raposa",
    }),
  });
  const dados = await resposta.json();
  assert.equal(resposta.status, 201);
  assert.equal(dados.usuario.id, "17");
  assert.equal(dados.usuario.emailVerificado, false);
  assert.equal(await bcrypt.compare("SenhaSegura123", conta.senha), true);
});

test("rotas de e-mail são removidas e links antigos de verificação voltam ao login", async (t) => {
  const base = await iniciarServidor(t, createApp());
  const antiga = await fetch(`${base}/verificar-email`, { redirect: "manual" });
  assert.equal(antiga.status, 302);
  assert.equal(antiga.headers.get("location"), "/login?verificacaoDesativada=1");

  const envio = await fetch(`${base}/api/email/codigo`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "a@b.com", finalidade: "cadastro" }),
  });
  assert.equal(envio.status, 404);
});

test("recuperação sem e-mail exige autenticação e a senha atual", async (t) => {
  const segredo = "chave-de-teste-com-tamanho-suficiente";
  const hash = await bcrypt.hash("SenhaSegura123", 4);
  const usuario = {
    id: "8",
    nome: "Ana",
    email: "ana@exemplo.com",
    senha: hash,
    tipo: "usuario",
    avatar: null,
    emailVerificado: 0,
    notificacoes: null,
    cidadesInteresse: null,
  };
  const query = async (sql) => {
    if (sql.includes("FROM users WHERE id_user = ?")) {
      return [usuario];
    }
    throw new Error(`Consulta inesperada: ${sql}`);
  };
  const app = express();
  app.use(express.json());
  app.use("/api/usuarios", criarUsuarioRoutes({ query, segredo }));
  const base = await iniciarServidor(t, app);

  const resposta = await fetch(`${base}/api/usuarios/8`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${assinarToken({ id: "8" }, segredo)}`,
    },
    body: JSON.stringify({ novaSenha: "OutraSenha456" }),
  });
  assert.equal(resposta.status, 403);
  assert.match((await resposta.json()).mensagem, /senha atual/);
});

test("somente administrador autenticado pode publicar evento", async (t) => {
  const segredo = "chave-de-teste-com-tamanho-suficiente";
  let evento;
  const query = async (sql, params = []) => {
    if (sql.includes("FROM users WHERE id_user = ?")) {
      return [{
        id: params[0],
        nome: "Admin",
        email: "admin@exemplo.com",
        tipo: params[0] === "2" ? "usuario" : "administrador",
        avatar: null,
        emailVerificado: 1,
      }];
    }
    if (sql.includes("FROM eventos e LEFT JOIN users u")) {
      return evento && String(evento.id) === String(params[0]) ? [evento] : [];
    }
    if (sql.includes("INSERT INTO eventos")) {
      evento = {
        id: 9,
        titulo: params[0],
        categoria: params[1],
        descricao: params[2],
        data: params[3],
        hora: params[4],
        cidade: params[5],
        local: params[6],
        preco: params[7],
        vagas: params[8],
        link: params[9],
        capa: params[10],
        publicadorTipo: "administrador",
        publicadorNome: "Admin",
        publicadorAvatar: null,
      };
      assert.equal(params[11], "1");
      return { insertId: 9 };
    }
    if (sql.includes("UPDATE eventos SET")) {
      Object.assign(evento, {
        titulo: params[0],
        categoria: params[1],
        descricao: params[2],
        data: params[3],
        hora: params[4],
        cidade: params[5],
        local: params[6],
        preco: params[7],
        vagas: params[8],
        link: params[9],
        capa: params[10],
      });
      return { affectedRows: 1 };
    }
    if (sql.startsWith("DELETE FROM eventos")) {
      const removido = evento && String(evento.id) === String(params[0]);
      evento = null;
      return { affectedRows: Number(removido) };
    }
    throw new Error(`Consulta inesperada: ${sql}`);
  };
  const app = express();
  app.use(express.json());
  app.use("/api/eventos", criarEventoRoutes({ query, segredo }));
  const base = await iniciarServidor(t, app);
  const corpo = {
    titulo: "Evento de teste",
    categoria: "musica",
    descricao: "Descrição do evento",
    data: "2027-05-10",
    hora: "19:30",
    cidade: "Ipatinga",
    local: "Parque Ipanema",
    preco: 0,
    idPublicador: "999",
    tipoPublicador: "administrador",
  };

  const semLogin = await fetch(`${base}/api/eventos`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  assert.equal(semLogin.status, 401);

  const tokenUsuario = assinarToken({ id: "2" }, segredo);
  const semPermissao = await fetch(`${base}/api/eventos`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${tokenUsuario}` },
    body: JSON.stringify(corpo),
  });
  assert.equal(semPermissao.status, 403);

  const tokenAdmin = assinarToken({ id: "1" }, segredo);
  const publicado = await fetch(`${base}/api/eventos`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${tokenAdmin}` },
    body: JSON.stringify(corpo),
  });
  const resposta = await publicado.json();
  assert.equal(publicado.status, 201);
  assert.equal(resposta.evento.id, "9");
  assert.equal(resposta.evento.publicador.tipo, "administrador");

  const atualizado = await fetch(`${base}/api/eventos/9`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${tokenAdmin}` },
    body: JSON.stringify({ titulo: "Evento revisado" }),
  });
  assert.equal(atualizado.status, 200);
  assert.equal((await atualizado.json()).evento.titulo, "Evento revisado");

  const removido = await fetch(`${base}/api/eventos/9`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${tokenAdmin}` },
  });
  assert.equal(removido.status, 204);
});

test("upload de capa armazena no Supabase e grava a URL no evento", async (t) => {
  const segredo = "chave-de-teste-com-tamanho-suficiente";
  const urlCapa = "https://projeto.supabase.co/storage/v1/object/public/event-covers/eventos/capa.png";
  let evento;
  let arquivoEnviado;
  const query = async (sql, params = []) => {
    if (sql.includes("FROM users WHERE id_user = ?")) {
      return [{
        id: params[0], nome: "Admin", email: "admin@exemplo.com", tipo: "administrador",
        avatar: null, emailVerificado: 1,
      }];
    }
    if (sql.includes("FROM eventos e LEFT JOIN users u")) {
      return evento ? [evento] : [];
    }
    if (sql.includes("INSERT INTO eventos")) {
      assert.equal(params[10], urlCapa);
      evento = {
        id: 21, titulo: params[0], categoria: params[1], descricao: params[2],
        data: params[3], hora: params[4], cidade: params[5], local: params[6],
        preco: params[7], vagas: params[8], link: params[9], capa: params[10],
        publicadorTipo: "administrador", publicadorNome: "Admin", publicadorAvatar: null,
      };
      return { insertId: 21 };
    }
    throw new Error(`Consulta inesperada: ${sql}`);
  };
  const armazenamento = {
    async subirCapa(arquivo, tipo) {
      arquivoEnviado = { buffer: arquivo.buffer, tipo };
      return urlCapa;
    },
    async removerCapa() {},
  };
  const app = express();
  app.use(express.json());
  app.use("/api/eventos", criarEventoRoutes({ query, segredo, armazenamento }));
  const base = await iniciarServidor(t, app);
  const formulario = new FormData();
  for (const [campo, valor] of Object.entries({
    titulo: "Evento com capa",
    categoria: "musica",
    descricao: "Descrição do evento",
    data: "2099-05-10",
    hora: "19:30",
    cidade: "Ipatinga",
    local: "Parque Ipanema",
    preco: "0",
  })) {
    formulario.append(campo, valor);
  }
  formulario.append(
    "capa",
    new Blob([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])], { type: "image/png" }),
    "capa.png",
  );

  const resposta = await fetch(`${base}/api/eventos`, {
    method: "POST",
    headers: { authorization: `Bearer ${assinarToken({ id: "1" }, segredo)}` },
    body: formulario,
  });
  const dados = await resposta.json();
  assert.equal(resposta.status, 201);
  assert.equal(arquivoEnviado.tipo, "image/png");
  assert.equal(dados.evento.capa, urlCapa);
  assert.equal(evento.capa, urlCapa);
});
