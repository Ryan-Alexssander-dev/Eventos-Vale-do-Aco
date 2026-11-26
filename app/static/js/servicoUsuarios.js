// CRUD de usuários (e tudo que pertence a um usuário). Os caminhos vêm de configuracao.js.

import { configuracao, montarCaminho } from "./configuracao.js";
import { extrairItem, extrairLista, requisitar } from "./api.js";
import { normalizarEvento, normalizarUsuario } from "./normalizadores.js";

const { caminhos, metodoAtualizacao } = configuracao;

// Login. A API pode devolver { usuario, token } ou o próprio usuário. AJUSTAR conforme a API.
export async function autenticar({ email, senha }) {
  const dados = await requisitar(caminhos.autenticacao, { metodo: "POST", corpo: { email, senha } });
  const usuario = normalizarUsuario(dados?.usuario ?? dados?.user ?? dados);
  return { usuario, token: dados?.token ?? dados?.accessToken ?? null };
}

export async function criarUsuario(dados) {
  const resposta = await requisitar(caminhos.usuarios, { metodo: "POST", corpo: dados });
  return normalizarUsuario(extrairItem(resposta, ["usuario"]));
}

export async function buscarUsuario(id) {
  const resposta = await requisitar(`${caminhos.usuarios}/${encodeURIComponent(id)}`);
  return normalizarUsuario(extrairItem(resposta, ["usuario"]));
}

export async function atualizarUsuario(id, parcial) {
  const resposta = await requisitar(`${caminhos.usuarios}/${encodeURIComponent(id)}`, { metodo: metodoAtualizacao, corpo: parcial });
  return normalizarUsuario(extrairItem(resposta, ["usuario"])) ?? null;
}

// Troca de senha de quem está logado (exige a senha atual).
export async function atualizarSenha(id, { senhaAtual, novaSenha }) {
  await requisitar(`${caminhos.usuarios}/${encodeURIComponent(id)}`, { metodo: metodoAtualizacao, corpo: { senhaAtual, novaSenha } });
}

export async function excluirUsuario(id, senha) {
  await requisitar(`${caminhos.usuarios}/${encodeURIComponent(id)}`, { metodo: "DELETE", corpo: { senha } });
}

// ---- Eventos salvos do usuário --------------------------------------------------------------
export async function listarEventosSalvos(idUsuario) {
  const resposta = await requisitar(montarCaminho(caminhos.eventosSalvos, { idUsuario }));
  return extrairLista(resposta, ["eventos"]).map(normalizarEvento);
}

export async function salvarEvento(idUsuario, idEvento) {
  await requisitar(montarCaminho(caminhos.eventosSalvos, { idUsuario }), { metodo: "POST", corpo: { idEvento } });
}

export async function removerEventoSalvo(idUsuario, idEvento) {
  await requisitar(`${montarCaminho(caminhos.eventosSalvos, { idUsuario })}/${encodeURIComponent(idEvento)}`, { metodo: "DELETE" });
}
