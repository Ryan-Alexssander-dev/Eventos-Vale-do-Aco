// Preferências de uso (cidade e filtros) e e-mail lembrado. Só vão para cookie se o usuário consentiu;
// sem consentimento ficam apenas em memória, até fechar a página.

import { apagarCookie, gravarCookie, lerCookie } from "./cookies.js";
import { podeUsarPreferencias } from "./consentimento.js";
import { configuracao } from "./configuracao.js";

const COOKIE_PREFERENCIAS = "vdaPreferencias";
const COOKIE_EMAIL = "vdaEmail";
const VALORES_PRECO = ["todos", "gratuito", "pago"];
const PERIODOS = ["todos", "7dias", "mes", "passados"];

let memoria = {};

function sanear(bruto) {
  const saida = {};
  if (configuracao.cidades.includes(bruto?.cidade)) {
    saida.cidade = bruto.cidade;
  }
  if (VALORES_PRECO.includes(bruto?.valor)) {
    saida.valor = bruto.valor;
  }
  const s = bruto?.salvos ?? {};
  saida.salvos = {
    cidade: configuracao.cidades.includes(s.cidade) ? s.cidade : "todas",
    categoria: configuracao.categorias.some((c) => c.valor === s.categoria) ? s.categoria : "todas",
    valor: VALORES_PRECO.includes(s.valor) ? s.valor : "todos",
    periodo: PERIODOS.includes(s.periodo) ? s.periodo : "todos",
  };
  return saida;
}

export function lerPreferencias() {
  if (podeUsarPreferencias()) {
    try {
      return sanear(JSON.parse(lerCookie(COOKIE_PREFERENCIAS) ?? "{}"));
    } catch {
      return sanear({});
    }
  }
  return sanear(memoria);
}

export function salvarPreferencias(parcial) {
  memoria = { ...lerPreferencias(), ...parcial };
  if (podeUsarPreferencias()) {
    gravarCookie(COOKIE_PREFERENCIAS, JSON.stringify(sanear(memoria)), { dias: 180 });
  }
}

// Ao aceitar os cookies depois de já ter escolhido filtros, grava o que está em memória.
document.addEventListener("vda:consentimento", (e) => {
  if (e.detail.preferencias && Object.keys(memoria).length) {
    salvarPreferencias(memoria);
  }
});

export function lembrarEmail(email) {
  if (podeUsarPreferencias()) {
    gravarCookie(COOKIE_EMAIL, email, { dias: 90 });
  }
}

export function obterEmailLembrado() {
  return podeUsarPreferencias() ? (lerCookie(COOKIE_EMAIL) ?? "") : "";
}

export function esquecerEmail() {
  apagarCookie(COOKIE_EMAIL);
}
