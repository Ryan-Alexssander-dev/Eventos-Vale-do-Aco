// CRUD de usuários (e tudo que pertence a um usuário). Os caminhos vêm de configuracao.js.
// Se usarDadosSimulados estiver ligado, as funções são atendidas por simulacao/dadosSimulados.js.

import { configuracao, montarCaminho } from "./configuracao.js";
import { extrairItem, extrairLista, requisitar, ErroApi } from "./api.js";
import { normalizarEvento, normalizarUsuario } from "./normalizadores.js";

const { caminhos, metodoAtualizacao } = configuracao;
const simulacao = () => import("./simulacao/dadosSimulados.js");

// Login. A API pode devolver { usuario, token } ou o próprio usuário. AJUSTAR conforme a API.
export async function autenticar({ email, senha }) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).autenticar({ email, senha });
  }
  const dados = await requisitar(caminhos.autenticacao, { metodo: "POST", corpo: { email, senha } });
  const usuario = normalizarUsuario(dados?.usuario ?? dados?.user ?? dados);
  return { usuario, token: dados?.token ?? dados?.accessToken ?? null };
}

export async function criarUsuario(dados) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).criarUsuario(dados);
  }
  const resposta = await requisitar(caminhos.usuarios, { metodo: "POST", corpo: dados });
  return normalizarUsuario(extrairItem(resposta, ["usuario"]));
}

export async function buscarUsuario(id) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).buscarUsuario(id);
  }
  const resposta = await requisitar(`${caminhos.usuarios}/${encodeURIComponent(id)}`);
  return normalizarUsuario(extrairItem(resposta, ["usuario"]));
}

export async function buscarUsuarioPorEmail(email) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).buscarUsuarioPorEmail(email);
  }
  try {
    const resposta = await requisitar(caminhos.usuarios, { parametros: { email } });
    const lista = extrairLista(resposta, ["usuarios"]);
    return normalizarUsuario(lista[0] ?? (Array.isArray(resposta) ? null : extrairItem(resposta, ["usuario"])));
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) {
      return null;
    }
    throw erro;
  }
}

export async function atualizarUsuario(id, parcial) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).atualizarUsuario(id, parcial);
  }
  const resposta = await requisitar(`${caminhos.usuarios}/${encodeURIComponent(id)}`, { metodo: metodoAtualizacao, corpo: parcial });
  return normalizarUsuario(extrairItem(resposta, ["usuario"])) ?? null;
}

// Troca de senha de quem está logado (exige a senha atual).
export async function atualizarSenha(id, { senhaAtual, novaSenha }) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).atualizarSenha(id, { senhaAtual, novaSenha });
  }
  await requisitar(`${caminhos.usuarios}/${encodeURIComponent(id)}`, { metodo: metodoAtualizacao, corpo: { senhaAtual, novaSenha } });
}

// Recuperação de senha: vale com o token devolvido pela verificação do código de e-mail.
export async function redefinirSenha({ email, novaSenha, tokenVerificacao }) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).redefinirSenha({ email, novaSenha, tokenVerificacao });
  }
  const usuario = await buscarUsuarioPorEmail(email);
  if (!usuario) {
    throw new ErroApi("Não encontramos uma conta com esse e-mail.", 404);
  }
  await requisitar(`${caminhos.usuarios}/${encodeURIComponent(usuario.id)}`, { metodo: metodoAtualizacao, corpo: { novaSenha, tokenVerificacao } });
}

export async function confirmarEmail(id, tokenVerificacao) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).confirmarEmail(id, tokenVerificacao);
  }
  await requisitar(`${caminhos.usuarios}/${encodeURIComponent(id)}`, { metodo: metodoAtualizacao, corpo: { emailVerificado: true, tokenVerificacao } });
}

export async function excluirUsuario(id, senha) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).excluirUsuario(id, senha);
  }
  await requisitar(`${caminhos.usuarios}/${encodeURIComponent(id)}`, { metodo: "DELETE", corpo: { senha } });
}

// ---- Eventos salvos do usuário --------------------------------------------------------------
export async function listarEventosSalvos(idUsuario) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).listarEventosSalvos(idUsuario);
  }
  const resposta = await requisitar(montarCaminho(caminhos.eventosSalvos, { idUsuario }));
  return extrairLista(resposta, ["eventos"]).map(normalizarEvento);
}

export async function salvarEvento(idUsuario, idEvento) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).salvarEvento(idUsuario, idEvento);
  }
  await requisitar(montarCaminho(caminhos.eventosSalvos, { idUsuario }), { metodo: "POST", corpo: { idEvento } });
}

export async function removerEventoSalvo(idUsuario, idEvento) {
  if (configuracao.usarDadosSimulados) {
    return (await simulacao()).removerEventoSalvo(idUsuario, idEvento);
  }
  await requisitar(`${montarCaminho(caminhos.eventosSalvos, { idUsuario })}/${encodeURIComponent(idEvento)}`, { metodo: "DELETE" });
}
