// Função genérica para falar com a API. Recebe o CAMINHO como argumento — não conhece rotas específicas.
//   const dados = await requisitar("/api/qualquer-coisa", { metodo: "POST", corpo: { a: 1 } });

import { configuracao } from "./configuracao.js";
import { estaLogado, irParaLogin, limparSessao, obterToken } from "./sessao.js";

export class ErroApi extends Error {
  constructor(mensagem, status = 0, dados = null) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.dados = dados;
  }
}

const mensagensPorStatus = {
  400: "Os dados enviados não são válidos.",
  401: "E-mail ou senha incorretos.",
  403: "Você não tem permissão para fazer isso.",
  404: "Não encontramos o que você procura.",
  409: "Esse registro já existe.",
  429: "Muitas tentativas. Aguarde um pouco e tente de novo.",
  500: "Erro interno do servidor. Tente novamente mais tarde.",
  503: "Serviço indisponível no momento. Tente novamente mais tarde.",
};

export async function requisitar(caminho, opcoes = {}) {
  const { metodo = "GET", corpo, parametros, cabecalhos = {} } = opcoes;

  const url = new URL(configuracao.baseApi + caminho, window.location.origin);
  for (const [nome, valor] of Object.entries(parametros ?? {})) {
    if (valor !== undefined && valor !== null && valor !== "") url.searchParams.set(nome, valor);
  }

  const ehArquivo = corpo instanceof FormData;
  const token = obterToken();
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), configuracao.tempoLimiteRequisicaoMs);

  let resposta;
  try {
    resposta = await fetch(url, {
      method: metodo,
      credentials: "same-origin",
      signal: controlador.signal,
      headers: {
        Accept: "application/json",
        ...(corpo !== undefined && !ehArquivo ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...cabecalhos,
      },
      body: corpo === undefined ? undefined : ehArquivo ? corpo : JSON.stringify(corpo),
    });
  } catch (erro) {
    const esgotou = erro.name === "AbortError";
    throw new ErroApi(
      esgotou ? "O servidor demorou demais para responder." : "Não foi possível conectar ao servidor. Verifique sua conexão."
    );
  } finally {
    clearTimeout(temporizador);
  }

  const ehJson = (resposta.headers.get("content-type") ?? "").includes("json");
  const dados = resposta.status === 204 || !ehJson ? null : await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // Sessão expirada: quem estava logado volta para o login.
    if (resposta.status === 401 && estaLogado() && !window.location.pathname.startsWith("/login")) {
      limparSessao();
      irParaLogin();
    }
    const mensagem = dados?.mensagem ?? dados?.erro ?? mensagensPorStatus[resposta.status] ?? "Algo deu errado. Tente novamente.";
    throw new ErroApi(mensagem, resposta.status, dados);
  }
  return dados;
}

// As respostas podem vir como lista pura ou embrulhadas ({ dados: [...] }, { eventos: [...] }...).
export function extrairLista(dados, chaves = []) {
  if (Array.isArray(dados)) return dados;
  for (const chave of [...chaves, "dados", "itens", "resultados", "lista"]) {
    if (Array.isArray(dados?.[chave])) return dados[chave];
  }
  return [];
}

export function extrairItem(dados, chaves = []) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) return dados ?? null;
  for (const chave of [...chaves, "dados", "item", "resultado"]) {
    if (dados[chave] && typeof dados[chave] === "object") return dados[chave];
  }
  return dados;
}
