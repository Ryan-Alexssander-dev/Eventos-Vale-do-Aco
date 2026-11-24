// Consentimento de cookies (LGPD).
//   necessários  -> sempre ativos: guardam só a sua própria escolha de consentimento.
//   preferências -> opcionais: lembram cidade e filtros escolhidos e o e-mail do login ("Lembrar-me").
// O site não usa cookies de publicidade nem de estatísticas.

import { apagarCookie, gravarCookie, lerCookie } from "./cookies.js";

const NOME_COOKIE = "vdaConsentimento";
const VERSAO = 1; // aumente quando mudar o tipo de cookie usado: o banner volta a aparecer
export const COOKIES_DE_PREFERENCIAS = ["vdaPreferencias", "vdaEmail"];

export function obterConsentimento() {
  try {
    const dados = JSON.parse(lerCookie(NOME_COOKIE) ?? "null");
    return dados?.v === VERSAO ? dados : null;
  } catch {
    return null;
  }
}

export function podeUsarPreferencias() {
  return obterConsentimento()?.preferencias === true;
}

export function salvarConsentimento({ preferencias }) {
  gravarCookie(NOME_COOKIE, JSON.stringify({ v: VERSAO, preferencias: Boolean(preferencias), data: new Date().toISOString().slice(0, 10) }), { dias: 180 });
  if (!preferencias) {
    COOKIES_DE_PREFERENCIAS.forEach(apagarCookie);
  }
  document.dispatchEvent(new CustomEvent("vda:consentimento", { detail: { preferencias: Boolean(preferencias) } }));
}

export function iniciarConsentimento() {
  const banner = document.getElementById("bannerCookies");
  const modalElemento = document.getElementById("modalCookies");
  if (!banner || !modalElemento) {
    return;
  }

  const campoPreferencias = document.getElementById("cookiesPreferencias");
  const modal = () => window.bootstrap.Modal.getOrCreateInstance(modalElemento);

  const esconderBanner = () => banner.classList.add("d-none");
  if (!obterConsentimento()) {
    banner.classList.remove("d-none");
  }

  const acoes = {
    aceitarTodos() {
      salvarConsentimento({ preferencias: true });
      esconderBanner();
    },
    recusar() {
      salvarConsentimento({ preferencias: false });
      esconderBanner();
    },
    personalizar() {
      campoPreferencias.checked = podeUsarPreferencias();
      modal().show();
    },
    abrir() {
      campoPreferencias.checked = podeUsarPreferencias();
      modal().show();
    },
    salvar() {
      salvarConsentimento({ preferencias: campoPreferencias.checked });
      esconderBanner();
      modal().hide();
    },
  };

  document.querySelectorAll("[data-cookies-acao]").forEach((botao) => {
    botao.addEventListener("click", () => acoes[botao.dataset.cookiesAcao]?.());
  });
}
