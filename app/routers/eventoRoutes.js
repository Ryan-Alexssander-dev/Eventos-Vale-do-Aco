// CRUD de eventos (montado em /api/eventos) — a ser implementado pela equipe de back-end.
//
// O front-end (app/static/js/servicoEventos.js) espera, ajustáveis em app/static/js/configuracao.js:
//   GET    /            lista de eventos (todos, o front filtra)
//   GET    /:id         um evento
//   POST   /            cria evento (JSON ou multipart quando há imagem de capa) — somente administrador
//   PATCH  /:id         atualiza — somente administrador
//   DELETE /:id         exclui — somente administrador
//   POST   /:idEvento/inscricoes   { idUsuario }  registra inscrição
// Detalhes em docs/CONTRATO-DA-API.md.

const express = require("express");
const multer = require("multer");
const database = require("../database");
const { criarAutenticacao } = require("../middlewares/autenticacao");
const { obterSegredo } = require("../services/tokensAcesso");

const CIDADES = new Set(["Coronel Fabriciano", "Ipatinga", "Timóteo"]);
const CATEGORIAS = new Set(["musica", "esportes", "gastronomia", "teatro", "feiras", "comunidade"]);
const LIMITE_CAPA = 2 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITE_CAPA, files: 1 } });
const SQL_EVENTO = `
  SELECT e.id_event AS id, e.nomeEvento AS titulo, e.categoria, e.descricao,
         DATE_FORMAT(e.dataEvento, '%Y-%m-%d') AS data,
         DATE_FORMAT(e.horaEvento, '%H:%i') AS hora,
         e.cidade, e.endereco AS local, e.precoIngresso AS preco,
         e.qtdIngresso AS vagas, e.link, e.capa, e.id_user,
         u.tipo AS publicadorTipo, u.nome AS publicadorNome, u.avatar AS publicadorAvatar
  FROM eventos e LEFT JOIN users u ON u.id_user = e.id_user
`;

function decodificarCapa(arquivo) {
  const buffer = arquivo.buffer;
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return `data:image/png;base64,${buffer.toString("base64")}`;
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return `data:image/webp;base64,${buffer.toString("base64")}`;
  }
  return null;
}

function valorDoCorpo(corpo, nomes, atual) {
  for (const nome of nomes) {
    if (corpo[nome] !== undefined) {
      return corpo[nome];
    }
  }
  return atual;
}

function validarEvento(corpo, atual, arquivo) {
  const titulo = String(valorDoCorpo(corpo, ["titulo", "nomeEvento"], atual?.titulo) ?? "").trim();
  const categoria = String(valorDoCorpo(corpo, ["categoria"], atual?.categoria) ?? "");
  const descricao = String(valorDoCorpo(corpo, ["descricao"], atual?.descricao) ?? "").trim();
  const data = String(valorDoCorpo(corpo, ["data", "dataEvento"], atual?.data) ?? "");
  const hora = String(valorDoCorpo(corpo, ["hora", "horaEvento"], atual?.hora) ?? "");
  const cidade = String(valorDoCorpo(corpo, ["cidade"], atual?.cidade) ?? "");
  const local = String(valorDoCorpo(corpo, ["local", "endereco"], atual?.local) ?? "").trim();
  const precoBruto = valorDoCorpo(corpo, ["preco", "precoIngresso"], atual?.preco);
  const vagasBrutas = valorDoCorpo(corpo, ["vagas", "qtdIngresso"], atual?.vagas);
  const linkBruto = valorDoCorpo(corpo, ["link"], atual?.link);
  const link = linkBruto == null ? "" : String(linkBruto).trim();
  const preco = Number(precoBruto);
  const vagas = vagasBrutas == null || String(vagasBrutas).trim() === "" ? null : Number(vagasBrutas);
  const dataPartes = data.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const dataValida = dataPartes && new Date(Date.UTC(+dataPartes[1], +dataPartes[2] - 1, +dataPartes[3]))
    .toISOString().startsWith(data);
  const horaPartes = hora.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  const capaExistente = valorDoCorpo(corpo, ["capa"], atual?.capa) ?? null;
  const capa = arquivo ? decodificarCapa(arquivo) : capaExistente;

  if (
    !titulo || titulo.length > 200 ||
    !CATEGORIAS.has(categoria) ||
    !descricao || descricao.length > 255 ||
    !dataValida || !horaPartes ||
    !CIDADES.has(cidade) ||
    !local || local.length > 255 ||
    !Number.isFinite(preco) || preco < 0 ||
    (vagas !== null && (!Number.isInteger(vagas) || vagas < 0)) ||
    (link !== "" && link.length > 255) ||
    (link !== "" && !/^https?:\/\//i.test(link)) ||
    (arquivo && !capa) ||
    (!arquivo && capa && !/^https?:\/\//i.test(capa) && !/^data:image\/(?:png|jpeg|webp);base64,/i.test(capa))
  ) {
    return null;
  }
  return { titulo, categoria, descricao, data, hora, cidade, local, preco, vagas, link: link || null, capa };
}

function processarCapa(req, res, next) {
  upload.single("capa")(req, res, (error) => {
    if (!error) {
      return next();
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ mensagem: "A imagem de capa deve ter no máximo 2 MB." });
    }
    return res.status(400).json({ mensagem: "Não foi possível processar a imagem enviada." });
  });
}

function eventoPublico(linha) {
  return {
    id: String(linha.id),
    titulo: linha.titulo,
    categoria: linha.categoria,
    descricao: linha.descricao,
    data: linha.data,
    hora: linha.hora,
    cidade: linha.cidade,
    local: linha.local,
    preco: Number(linha.preco),
    vagas: linha.vagas,
    link: linha.link ?? "",
    capa: linha.capa ?? "",
    publicador: {
      tipo: linha.publicadorTipo ?? "administrador",
      nome: linha.publicadorTipo === "administrador" ? "" : (linha.publicadorNome ?? ""),
      avatar: linha.publicadorAvatar ?? "",
    },
  };
}

function criarEventoRoutes({ query = database.query, segredo = obterSegredo() } = {}) {
  const router = express.Router();
  const { exigirUsuario, exigirAdministrador } = criarAutenticacao({ query, segredo });

  async function buscarPorId(id) {
    const linhas = await query(`${SQL_EVENTO} WHERE e.id_event = ?`, [id]);
    return linhas[0] ? eventoPublico(linhas[0]) : null;
  }

  router.get("/", async (_req, res, next) => {
    try {
      const linhas = await query(`${SQL_EVENTO} ORDER BY e.dataEvento, e.horaEvento`);
      return res.json(linhas.map(eventoPublico));
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ mensagem: "Informe um ID de evento válido." });
    }
    try {
      const evento = await buscarPorId(req.params.id);
      return evento
        ? res.json({ evento })
        : res.status(404).json({ mensagem: "Evento não encontrado." });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", exigirUsuario, exigirAdministrador, processarCapa, async (req, res, next) => {
    const evento = validarEvento(req.body ?? {}, null, req.file);
    if (!evento) {
      return res.status(400).json({ mensagem: "Confira os dados do evento e da imagem de capa." });
    }
    try {
      const resultado = await query(
        `INSERT INTO eventos
          (nomeEvento, categoria, descricao, dataEvento, horaEvento, cidade, endereco,
           precoIngresso, qtdIngresso, link, capa, id_user)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evento.titulo, evento.categoria, evento.descricao, evento.data, evento.hora,
          evento.cidade, evento.local, evento.preco, evento.vagas, evento.link, evento.capa,
          req.usuario.id,
        ],
      );
      const criado = await buscarPorId(resultado.insertId);
      return res.status(201).json({ evento: criado });
    } catch (error) {
      return next(error);
    }
  });

  router.patch("/:id", exigirUsuario, exigirAdministrador, processarCapa, async (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ mensagem: "Informe um ID de evento válido." });
    }
    try {
      const atual = await buscarPorId(req.params.id);
      if (!atual) {
        return res.status(404).json({ mensagem: "Evento não encontrado." });
      }
      const evento = validarEvento(req.body ?? {}, atual, req.file);
      if (!evento) {
        return res.status(400).json({ mensagem: "Confira os dados do evento e da imagem de capa." });
      }
      await query(
        `UPDATE eventos SET nomeEvento = ?, categoria = ?, descricao = ?, dataEvento = ?,
          horaEvento = ?, cidade = ?, endereco = ?, precoIngresso = ?, qtdIngresso = ?,
          link = ?, capa = ? WHERE id_event = ?`,
        [
          evento.titulo, evento.categoria, evento.descricao, evento.data, evento.hora,
          evento.cidade, evento.local, evento.preco, evento.vagas, evento.link, evento.capa,
          req.params.id,
        ],
      );
      return res.json({ evento: await buscarPorId(req.params.id) });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", exigirUsuario, exigirAdministrador, processarCapa, async (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ mensagem: "Informe um ID de evento válido." });
    }
    try {
      const atual = await buscarPorId(req.params.id);
      if (!atual) {
        return res.status(404).json({ mensagem: "Evento não encontrado." });
      }
      const evento = validarEvento(req.body ?? {}, atual, req.file);
      if (!evento) {
        return res.status(400).json({ mensagem: "Confira os dados do evento e da imagem de capa." });
      }
      await query(
        `UPDATE eventos SET nomeEvento = ?, categoria = ?, descricao = ?, dataEvento = ?,
          horaEvento = ?, cidade = ?, endereco = ?, precoIngresso = ?, qtdIngresso = ?,
          link = ?, capa = ? WHERE id_event = ?`,
        [
          evento.titulo, evento.categoria, evento.descricao, evento.data, evento.hora,
          evento.cidade, evento.local, evento.preco, evento.vagas, evento.link, evento.capa,
          req.params.id,
        ],
      );
      return res.json({ evento: await buscarPorId(req.params.id) });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", exigirUsuario, exigirAdministrador, async (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ mensagem: "Informe um ID de evento válido." });
    }
    try {
      const resultado = await query("DELETE FROM eventos WHERE id_event = ?", [req.params.id]);
      if (resultado.affectedRows === 0) {
        return res.status(404).json({ mensagem: "Evento não encontrado." });
      }
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  router.post("/:idEvento/inscricoes", exigirUsuario, async (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.idEvento)) {
      return res.status(400).json({ mensagem: "Informe um ID de evento válido." });
    }
    try {
      await query(
        "INSERT IGNORE INTO inscricoes (id_user, id_event) VALUES (?, ?)",
        [req.usuario.id, req.params.idEvento],
      );
      return res.status(201).json({ ok: true });
    } catch (error) {
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(404).json({ mensagem: "Evento ou usuário não encontrado." });
      }
      return next(error);
    }
  });

  return router;
}

module.exports = criarEventoRoutes();
module.exports.criarEventoRoutes = criarEventoRoutes;
