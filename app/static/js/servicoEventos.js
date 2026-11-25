// CRUD de eventos e inscrições. Os caminhos vêm de configuracao.js.

import { configuracao, montarCaminho } from "./configuracao.js";
import { extrairItem, extrairLista, requisitar } from "./api.js";
import { eventoParaApi, normalizarEvento } from "./normalizadores.js";

const { caminhos, metodoAtualizacao, chaves } = configuracao;

// Lista de eventos guardada por 1 minuto na sessão: voltar para a vitrine fica instantâneo.
function lerCache() {
  try {
    const cache = JSON.parse(sessionStorage.getItem(chaves.cacheEventos) ?? "null");
    return cache && Date.now() - cache.em < configuracao.cacheEventosMs ? cache.eventos : null;
  } catch {
    return null;
  }
}

export function invalidarCacheEventos() {
  sessionStorage.removeItem(chaves.cacheEventos);
}

// Traz todos os eventos; os filtros da tela são aplicados no navegador (rápido, sem uma requisição por tecla).
export async function listarEventos() {
  const emCache = lerCache();
  if (emCache) {
    return emCache;
  }
  const resposta = await requisitar(caminhos.eventos);
  const eventos = extrairLista(resposta, ["eventos"]).map(normalizarEvento);
  try {
    sessionStorage.setItem(chaves.cacheEventos, JSON.stringify({ em: Date.now(), eventos }));
  } catch {
    /* sem espaço no armazenamento: segue sem cache */
  }
  return eventos;
}

export async function buscarEvento(id) {
  const resposta = await requisitar(`${caminhos.eventos}/${encodeURIComponent(id)}`);
  return normalizarEvento(extrairItem(resposta, ["evento"]));
}

export async function criarEvento(dados) {
  invalidarCacheEventos();
  const resposta = await requisitar(caminhos.eventos, { metodo: "POST", corpo: eventoParaApi(dados) });
  return normalizarEvento(extrairItem(resposta, ["evento"]));
}

export async function atualizarEvento(id, dados) {
  invalidarCacheEventos();
  const resposta = await requisitar(`${caminhos.eventos}/${encodeURIComponent(id)}`, { metodo: metodoAtualizacao, corpo: eventoParaApi(dados) });
  return normalizarEvento(extrairItem(resposta, ["evento"]));
}

export async function excluirEvento(id) {
  invalidarCacheEventos();
  await requisitar(`${caminhos.eventos}/${encodeURIComponent(id)}`, { metodo: "DELETE" });
}

export async function registrarInscricao(idEvento, idUsuario) {
  await requisitar(montarCaminho(caminhos.inscricoes, { idEvento }), { metodo: "POST", corpo: { idUsuario } });
}
