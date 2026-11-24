// Funções de interface usadas por todas as telas.

import { iniciarConsentimento } from "./consentimento.js";
import { urlAvatar } from "./avatares.js";
import { criarElemento, icone } from "./elementos.js";
import { primeiroNome } from "./formatacao.js";
import { ehAdministrador, irParaLogin, obterUsuario, rotaInicialPorTipo, sair } from "./sessao.js";

// ---------------------------------------------------------------------------
// Início de página: confere quem pode ver a tela, preenche o menu e liga o que é comum a todas.
// A conferência do navegador é só conforto (a API é quem protege os dados de verdade).
//   exigir: "logado" | "visitante" | "administrador" | null
export function iniciarPagina({ exigir = null } = {}) {
  const usuario = obterUsuario();

  if (exigir === "logado" && !usuario) {
    irParaLogin();
    return { continuar: false, usuario: null };
  }
  if (exigir === "visitante" && usuario) {
    window.location.replace(rotaInicialPorTipo(usuario.tipo));
    return { continuar: false, usuario };
  }
  if (exigir === "administrador" && !ehAdministrador(usuario)) {
    if (usuario) window.location.replace("/home");
    else irParaLogin();
    return { continuar: false, usuario };
  }

  if (usuario) {
    document.querySelectorAll("[data-usuario-nome]").forEach((el) => (el.textContent = usuario.nome));
    document.querySelectorAll("[data-usuario-primeiro-nome]").forEach((el) => (el.textContent = primeiroNome(usuario.nome)));
    document.querySelectorAll("[data-usuario-email]").forEach((el) => (el.textContent = usuario.email));
    document.querySelectorAll("[data-usuario-avatar]").forEach((el) => (el.src = urlAvatar(usuario.avatar)));
  }
  const administrador = ehAdministrador(usuario);
  document.querySelectorAll("[data-somente-admin]").forEach((el) => (el.hidden = !administrador));
  document.querySelectorAll("[data-ocultar-admin]").forEach((el) => (el.hidden = administrador));
  document.querySelectorAll("[data-acao=sair]").forEach((botao) => botao.addEventListener("click", sair));

  ativarAlternarSenha();
  iniciarConsentimento();
  return { continuar: true, usuario };
}

// ---------------------------------------------------------------------------
export function ativarAlternarSenha() {
  document.querySelectorAll("[data-alternar-senha]").forEach((botao) => {
    botao.addEventListener("click", () => {
      const campo = document.getElementById(botao.dataset.alternarSenha);
      const mostrar = campo.type === "password";
      campo.type = mostrar ? "text" : "password";
      botao.querySelector("i").className = mostrar ? "bi bi-eye-slash" : "bi bi-eye";
    });
  });
}

const iconesAlerta = {
  info: ["bi-info-circle-fill", "text-primary", ""],
  sucesso: ["bi-check-circle-fill", "text-success", "alerta-sucesso"],
  erro: ["bi-exclamation-triangle-fill", "text-danger", "alerta-erro"],
};

export function mostrarAlerta(texto, tipo = "info") {
  const alerta = document.getElementById("alertaFeedback");
  if (!alerta) return;
  const [classeIcone, corIcone, classeAlerta] = iconesAlerta[tipo] ?? iconesAlerta.info;
  alerta.classList.remove("d-none", "alerta-sucesso", "alerta-erro");
  if (classeAlerta) alerta.classList.add(classeAlerta);
  alerta.classList.add("d-flex");
  document.getElementById("iconeFeedback").className = `bi ${classeIcone} ${corIcone} fs-5`;
  document.getElementById("mensagemFeedback").textContent = texto;
  alerta.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

export function esconderAlerta() {
  const alerta = document.getElementById("alertaFeedback");
  alerta?.classList.add("d-none");
  alerta?.classList.remove("d-flex");
}

// Troca o estado do botão de envio (evita clique duplo e mostra o carregamento).
export function definirCarregando(botao, ligado, textoCarregando = "Aguarde...") {
  if (!botao) return;
  const texto = botao.querySelector("[data-botao-texto]");
  const indicador = botao.querySelector("[data-botao-indicador]");
  if (texto) {
    if (ligado) texto.dataset.original = texto.textContent;
    texto.textContent = ligado ? textoCarregando : (texto.dataset.original ?? texto.textContent);
  }
  indicador?.classList.toggle("d-none", !ligado);
  botao.disabled = ligado;
}

// Aviso rápido (toast do Bootstrap) para ações sem formulário, como salvar um evento.
export function mostrarAviso(texto, tipo = "sucesso") {
  let area = document.getElementById("areaAvisos");
  if (!area) {
    area = criarElemento("div", { classe: "area-avisos", atributos: { id: "areaAvisos", "aria-live": "polite" } });
    document.body.append(area);
  }
  const aviso = criarElemento(
    "div",
    { classe: `toast align-items-center border-0 aviso-${tipo}`, atributos: { role: "status" } },
    criarElemento(
      "div",
      { classe: "d-flex" },
      criarElemento("div", { classe: "toast-body", texto }),
      criarElemento("button", { classe: "btn-close btn-close-white me-2 m-auto", atributos: { type: "button", "data-bs-dismiss": "toast", "aria-label": "Fechar" } })
    )
  );
  area.append(aviso);
  const toast = window.bootstrap.Toast.getOrCreateInstance(aviso, { delay: 3500 });
  aviso.addEventListener("hidden.bs.toast", () => aviso.remove());
  toast.show();
}

export function atrasar(funcao, ms = 250) {
  let temporizador;
  return (...argumentos) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcao(...argumentos), ms);
  };
}

export function criarEsqueletosCartoes(quantidade = 3) {
  return Array.from({ length: quantidade }, () =>
    criarElemento(
      "div",
      { classe: "col-md-6 col-lg-4", atributos: { "aria-hidden": "true" } },
      criarElemento("div", { classe: "cartao-evento esqueleto" }, criarElemento("div", { classe: "esqueleto-capa" }), criarElemento("div", { classe: "esqueleto-linha larga" }), criarElemento("div", { classe: "esqueleto-linha" }))
    )
  );
}

export { icone };
