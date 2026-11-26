// Usuário logado no navegador. Sem cookie de sessão: os dados ficam no armazenamento do navegador
// (sessionStorage; localStorage quando marcar "Lembrar-me"). A autorização de verdade é da API.

import { configuracao } from "./configuracao.js";

const { chaves, tiposUsuario } = configuracao;

function ler(armazenamento, chave) {
  try {
    return armazenamento.getItem(chave);
  } catch {
    return null;
  }
}

function lerJson(chave) {
  const texto = ler(sessionStorage, chave) ?? ler(localStorage, chave);
  try {
    return texto ? JSON.parse(texto) : null;
  } catch {
    return null;
  }
}

export function obterUsuario() {
  return lerJson(chaves.usuario);
}

export function obterToken() {
  return ler(sessionStorage, chaves.token) ?? ler(localStorage, chaves.token);
}

export function estaLogado() {
  return Boolean(obterUsuario());
}

export function salvarSessao({ usuario, token }, lembrar = false) {
  limparSessao();
  const armazenamento = lembrar ? localStorage : sessionStorage;
  try {
    armazenamento.setItem(chaves.usuario, JSON.stringify(usuario));
    if (token) {
      armazenamento.setItem(chaves.token, token);
    }
  } catch {
    /* armazenamento indisponível (modo privado restrito) */
  }
}

export function atualizarUsuarioNaSessao(parcial) {
  const atual = obterUsuario();
  if (!atual) {
    return;
  }
  const armazenamento = ler(localStorage, chaves.usuario) ? localStorage : sessionStorage;
  armazenamento.setItem(chaves.usuario, JSON.stringify({ ...atual, ...parcial }));
}

export function limparSessao() {
  for (const armazenamento of [sessionStorage, localStorage]) {
    try {
      armazenamento.removeItem(chaves.usuario);
      armazenamento.removeItem(chaves.token);
    } catch {
      /* ignora */
    }
  }
}

export function ehAdministrador(usuario = obterUsuario()) {
  return usuario?.tipo === tiposUsuario.administrador;
}

export function rotaInicialPorTipo(tipo) {
  return tipo === tiposUsuario.administrador ? "/admin" : "/home";
}

// Aceita apenas caminhos internos ("/algo"), nunca endereços externos (evita redirecionamento malicioso).
export function sanitizarProximo(valor) {
  if (typeof valor === "string" && /^\/(?![/\\])[\w\-./?=&%]*$/.test(valor)) {
    return valor;
  }
  return null;
}

export function irParaLogin(proximo = window.location.pathname + window.location.search) {
  const destino = sanitizarProximo(proximo);
  window.location.href = destino && destino !== "/" ? `/login?proximo=${encodeURIComponent(destino)}` : "/login";
}

export function sair() {
  limparSessao();
  window.location.href = "/";
}
