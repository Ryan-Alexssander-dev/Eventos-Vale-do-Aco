// Implementação SIMULADA dos serviços (usuários, eventos, salvos e inscrições) no localStorage do navegador.
// Serve para usar e demonstrar o front-end enquanto a API real não existe.
// Ligada por configuracao.usarDadosSimulados. NÃO USE EM PRODUÇÃO (inclui contas de teste).
//   administrador: admin@exemplo.com / Admin@123      usuário: maria@exemplo.com / Senha@123

import { ErroApi } from "../api.js";
import { dataEmIso } from "../formatacao.js";
import { normalizarEvento, normalizarUsuario } from "../normalizadores.js";

const CHAVES = { usuarios: "vdaSimUsuarios", eventos: "vdaSimEventos", salvos: "vdaSimSalvos", inscricoes: "vdaSimInscricoes", proximoId: "vdaSimProximoId" };

const ler = (chave, padrao) => {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? padrao;
  } catch {
    return padrao;
  }
};
const gravar = (chave, valor) => localStorage.setItem(chave, JSON.stringify(valor));

async function resumir(texto) {
  if (globalThis.crypto?.subtle) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
    return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `x:${btoa(unescape(encodeURIComponent(texto)))}`;
}

function novoId() {
  const id = ler(CHAVES.proximoId, 100) + 1;
  gravar(CHAVES.proximoId, id);
  return String(id);
}

const emDias = (dias) => {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return dataEmIso(data);
};

async function garantirSementes() {
  if (ler(CHAVES.usuarios, null)) return;
  gravar(CHAVES.usuarios, [
    { id: "1", nome: "Administrador", email: "admin@exemplo.com", telefone: "31999990000", avatar: "leao", tipo: "administrador", emailVerificado: true, senhaHash: await resumir("Admin@123") },
    { id: "2", nome: "Maria Souza", email: "maria@exemplo.com", telefone: "31988880000", avatar: "raposa", tipo: "usuario", emailVerificado: true, senhaHash: await resumir("Senha@123") },
  ]);
  const admin = { tipo: "administrador", nome: "", avatar: "" };
  gravar(CHAVES.eventos, [
    { id: "1", titulo: "Festival de Música & Cultura do Vale", descricao: "Apresentações musicais regionais, praça de alimentação e atividades culturais ao ar livre.", data: emDias(5), hora: "19:00", cidade: "Ipatinga", local: "Parque Ipanema", categoria: "musica", preco: 0, publicador: admin },
    { id: "2", titulo: "Corrida Ecológica Serra dos Cocais", descricao: "Percursos de 5 km e 10 km com kit atleta, hidratação e premiação por categoria.", data: emDias(12), hora: "07:30", cidade: "Timóteo", local: "Praça 1º de Maio", categoria: "esportes", preco: 45, publicador: admin },
    { id: "3", titulo: "Feira de Gastronomia e Empreendedores", descricao: "Sabores locais, artesanato regional e música ao vivo no centro de Coronel Fabriciano.", data: emDias(19), hora: "18:00", cidade: "Coronel Fabriciano", local: "Praça da Estação", categoria: "gastronomia", preco: 0, publicador: { tipo: "organizador", nome: "Associação Comercial Local", avatar: "coruja" } },
    { id: "4", titulo: "Mostra de Teatro Contemporâneo", descricao: "Espetáculos teatrais com grupos independentes e bate-papo aberto com o elenco.", data: emDias(26), hora: "20:00", cidade: "Ipatinga", local: "Centro Cultural Usiminas", categoria: "teatro", preco: 30, publicador: { tipo: "organizador", nome: "Cia Cena Aberta", avatar: "raposa" } },
    { id: "5", titulo: "Oficina de Fotografia de Rua", descricao: "Prática guiada pelas ruas do centro, com dicas de composição e luz natural.", data: emDias(40), hora: "14:00", cidade: "Coronel Fabriciano", local: "Casa da Cultura", categoria: "comunidade", preco: 25, publicador: admin },
    { id: "6", titulo: "Feira de Troca de Livros", descricao: "Troca de livros usados e roda de leitura aberta ao público.", data: emDias(-10), hora: "09:00", cidade: "Coronel Fabriciano", local: "Biblioteca Municipal", categoria: "comunidade", preco: 0, publicador: admin },
  ]);
  gravar(CHAVES.salvos, {});
  gravar(CHAVES.inscricoes, []);
}

const publico = ({ senhaHash, ...usuario }) => normalizarUsuario(usuario);

async function usuarios() {
  await garantirSementes();
  return ler(CHAVES.usuarios, []);
}

async function exigirUsuario(id) {
  const lista = await usuarios();
  const usuario = lista.find((u) => u.id === String(id));
  if (!usuario) throw new ErroApi("Usuário não encontrado.", 404);
  return { lista, usuario };
}

// ---- Usuários ----------------------------------------------------------------------------------
export async function autenticar({ email, senha }) {
  const lista = await usuarios();
  const usuario = lista.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!usuario || usuario.senhaHash !== (await resumir(senha))) throw new ErroApi("E-mail ou senha incorretos.", 401);
  return { usuario: publico(usuario), token: null };
}

export async function criarUsuario(dados) {
  const lista = await usuarios();
  const email = String(dados.email).trim().toLowerCase();
  if (lista.some((u) => u.email.toLowerCase() === email)) throw new ErroApi("Já existe uma conta com esse e-mail.", 409);
  const usuario = {
    id: novoId(), nome: dados.nome, email, telefone: dados.telefone, avatar: dados.avatar ?? "",
    tipo: "usuario", emailVerificado: false, senhaHash: await resumir(dados.senha),
  };
  gravar(CHAVES.usuarios, [...lista, usuario]);
  return publico(usuario);
}

export async function buscarUsuario(id) {
  return publico((await exigirUsuario(id)).usuario);
}

export async function buscarUsuarioPorEmail(email) {
  const usuario = (await usuarios()).find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
  return usuario ? publico(usuario) : null;
}

export async function atualizarUsuario(id, parcial) {
  const { lista, usuario } = await exigirUsuario(id);
  for (const campo of ["nome", "telefone", "avatar", "notificacoes", "cidadesInteresse"]) {
    if (parcial[campo] !== undefined) usuario[campo] = parcial[campo];
  }
  gravar(CHAVES.usuarios, lista);
  return publico(usuario);
}

export async function atualizarSenha(id, { senhaAtual, novaSenha }) {
  const { lista, usuario } = await exigirUsuario(id);
  if (usuario.senhaHash !== (await resumir(senhaAtual))) throw new ErroApi("A senha atual está incorreta.", 403);
  usuario.senhaHash = await resumir(novaSenha);
  gravar(CHAVES.usuarios, lista);
}

export async function redefinirSenha({ email, novaSenha }) {
  const lista = await usuarios();
  const usuario = lista.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!usuario) throw new ErroApi("Não encontramos uma conta com esse e-mail.", 404);
  usuario.senhaHash = await resumir(novaSenha);
  gravar(CHAVES.usuarios, lista);
}

export async function confirmarEmail(id) {
  const { lista, usuario } = await exigirUsuario(id);
  usuario.emailVerificado = true;
  gravar(CHAVES.usuarios, lista);
}

export async function excluirUsuario(id, senha) {
  const { lista, usuario } = await exigirUsuario(id);
  if (usuario.senhaHash !== (await resumir(senha))) throw new ErroApi("A senha está incorreta.", 403);
  gravar(CHAVES.usuarios, lista.filter((u) => u.id !== usuario.id));
  const salvos = ler(CHAVES.salvos, {});
  delete salvos[usuario.id];
  gravar(CHAVES.salvos, salvos);
}

// ---- Eventos salvos ----------------------------------------------------------------------------
export async function listarEventosSalvos(idUsuario) {
  const ids = ler(CHAVES.salvos, {})[String(idUsuario)] ?? [];
  return (await listarEventos()).filter((e) => ids.includes(e.id));
}

export async function salvarEvento(idUsuario, idEvento) {
  await garantirSementes();
  const salvos = ler(CHAVES.salvos, {});
  const ids = new Set(salvos[String(idUsuario)] ?? []);
  ids.add(String(idEvento));
  salvos[String(idUsuario)] = [...ids];
  gravar(CHAVES.salvos, salvos);
}

export async function removerEventoSalvo(idUsuario, idEvento) {
  const salvos = ler(CHAVES.salvos, {});
  salvos[String(idUsuario)] = (salvos[String(idUsuario)] ?? []).filter((id) => id !== String(idEvento));
  gravar(CHAVES.salvos, salvos);
}

// ---- Eventos -----------------------------------------------------------------------------------
async function comPublicadores(eventos) {
  const lista = await usuarios();
  return eventos.map((evento) => {
    const autor = lista.find((u) => u.id === String(evento.idPublicador));
    const publicador = autor && evento.publicador?.tipo !== "organizador" ? { tipo: autor.tipo, nome: autor.nome, avatar: autor.avatar } : evento.publicador;
    return normalizarEvento({ ...evento, publicador });
  });
}

export async function listarEventos() {
  await garantirSementes();
  const eventos = await comPublicadores(ler(CHAVES.eventos, []));
  return eventos.sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));
}

export async function buscarEvento(id) {
  const evento = (await listarEventos()).find((e) => e.id === String(id));
  if (!evento) throw new ErroApi("Evento não encontrado.", 404);
  return evento;
}

async function reduzirImagem(arquivo) {
  try {
    const imagem = await createImageBitmap(arquivo);
    const tela = document.createElement("canvas");
    tela.width = 640;
    tela.height = 360;
    const contexto = tela.getContext("2d");
    const escala = Math.max(640 / imagem.width, 360 / imagem.height);
    contexto.drawImage(imagem, (640 - imagem.width * escala) / 2, (360 - imagem.height * escala) / 2, imagem.width * escala, imagem.height * escala);
    return tela.toDataURL("image/jpeg", 0.8);
  } catch {
    return "";
  }
}

function registroDoEvento(dados, capa) {
  const { capa: _arquivo, tipoPublicador, ...resto } = dados;
  return { ...resto, capa, preco: Number(dados.preco) || 0 };
}

export async function criarEvento(dados) {
  await garantirSementes();
  const capa = dados.capa instanceof File ? await reduzirImagem(dados.capa) : "";
  const evento = { id: novoId(), ...registroDoEvento(dados, capa), publicador: { tipo: "administrador", nome: "", avatar: "" } };
  gravar(CHAVES.eventos, [...ler(CHAVES.eventos, []), evento]);
  return (await buscarEvento(evento.id));
}

export async function atualizarEvento(id, dados) {
  const eventos = ler(CHAVES.eventos, []);
  const indice = eventos.findIndex((e) => e.id === String(id));
  if (indice < 0) throw new ErroApi("Evento não encontrado.", 404);
  const capa = dados.capa instanceof File ? await reduzirImagem(dados.capa) : eventos[indice].capa;
  eventos[indice] = { ...eventos[indice], ...registroDoEvento(dados, capa), id: eventos[indice].id, publicador: eventos[indice].publicador };
  gravar(CHAVES.eventos, eventos);
  return buscarEvento(id);
}

export async function excluirEvento(id) {
  gravar(CHAVES.eventos, ler(CHAVES.eventos, []).filter((e) => e.id !== String(id)));
  const salvos = ler(CHAVES.salvos, {});
  for (const chave of Object.keys(salvos)) salvos[chave] = salvos[chave].filter((e) => e !== String(id));
  gravar(CHAVES.salvos, salvos);
}

export async function registrarInscricao(idEvento, idUsuario) {
  await buscarEvento(idEvento);
  const inscricoes = ler(CHAVES.inscricoes, []);
  if (!inscricoes.some((i) => i.idEvento === String(idEvento) && i.idUsuario === String(idUsuario))) {
    inscricoes.push({ idEvento: String(idEvento), idUsuario: String(idUsuario), em: new Date().toISOString() });
    gravar(CHAVES.inscricoes, inscricoes);
  }
}
