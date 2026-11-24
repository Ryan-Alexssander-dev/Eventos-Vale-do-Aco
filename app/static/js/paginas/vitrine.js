// Vitrine de eventos: usada na tela inicial pública (/) e na inicial de quem está logado (/home).

import { criarCartaoEvento } from "../componentes.js";
import { alternarSalvo, carregarSalvos, estaSalvo } from "../estadoSalvos.js";
import { atrasar, criarEsqueletosCartoes, iniciarPagina, mostrarAlerta, mostrarAviso } from "../interface.js";
import { eventoJaAconteceu, pluralizar } from "../formatacao.js";
import { iniciarModalEvento } from "../modalEvento.js";
import { lerPreferencias, salvarPreferencias } from "../preferencias.js";
import { listarEventos } from "../servicoEventos.js";
import { rotuloCategoria, atualizarBotaoSalvar } from "../componentes.js";

const { continuar, usuario } = iniciarPagina({ exigir: document.body.dataset.exigir ?? null });
if (continuar) {
  iniciar(usuario);
}

const semAcentos = (texto) => String(texto).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

async function iniciar(usuario) {
  const grade = document.getElementById("gradeEventos");
  const abas = document.getElementById("abasCidades");
  const campoBusca = document.getElementById("campoBusca");
  const filtroValor = document.getElementById("filtroValor");
  const contagem = document.getElementById("contagemResultados");
  const estadoVazio = document.getElementById("estadoVazio");

  const preferencias = lerPreferencias();
  const filtros = { cidade: preferencias.cidade ?? "todas", busca: "", valor: preferencias.valor ?? "todos" };
  let eventos = [];

  filtroValor.value = filtros.valor;
  marcarAba();

  function marcarAba() {
    abas.querySelectorAll("button").forEach((botao) => {
      const ativa = botao.dataset.cidade === filtros.cidade;
      botao.classList.toggle("active", ativa);
      botao.setAttribute("aria-pressed", String(ativa));
    });
  }

  function filtrar() {
    const termo = semAcentos(filtros.busca.trim());
    return eventos.filter((evento) => {
      if (filtros.cidade !== "todas" && evento.cidade !== filtros.cidade) {
        return false;
      }
      if (filtros.valor === "gratuito" && !evento.gratuito) {
        return false;
      }
      if (filtros.valor === "pago" && evento.gratuito) {
        return false;
      }
      if (!termo) {
        return true;
      }
      return semAcentos([evento.titulo, evento.local, evento.descricao, evento.cidade, rotuloCategoria(evento.categoria)].join(" ")).includes(termo);
    });
  }

  function renderizar() {
    const lista = filtrar();
    grade.replaceChildren(...lista.map((evento) => criarCartaoEvento(evento, estaSalvo(evento.id))));
    contagem.textContent = `${pluralizar(lista.length, "evento encontrado", "eventos encontrados")}`;
    estadoVazio.classList.toggle("d-none", lista.length > 0);
  }

  grade.replaceChildren(...criarEsqueletosCartoes());
  try {
    const [todos] = await Promise.all([listarEventos(), usuario ? carregarSalvos().catch(() => []) : null]);
    eventos = todos.filter((evento) => !eventoJaAconteceu(evento));
    renderizar();
  } catch (erro) {
    grade.replaceChildren();
    contagem.textContent = "";
    mostrarAlerta(erro.message, "erro");
  }

  abas.addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-cidade]");
    if (!botao) {
      return;
    }
    filtros.cidade = botao.dataset.cidade;
    salvarPreferencias({ cidade: filtros.cidade === "todas" ? undefined : filtros.cidade });
    marcarAba();
    renderizar();
  });

  campoBusca.addEventListener("input", atrasar(() => {
    filtros.busca = campoBusca.value;
    renderizar();
  }));
  document.getElementById("formularioBusca").addEventListener("submit", (e) => {
    e.preventDefault();
    filtros.busca = campoBusca.value;
    renderizar();
  });
  filtroValor.addEventListener("change", () => {
    filtros.valor = filtroValor.value;
    salvarPreferencias({ valor: filtros.valor });
    renderizar();
  });
  document.getElementById("botaoLimparFiltros").addEventListener("click", () => {
    Object.assign(filtros, { cidade: "todas", busca: "", valor: "todos" });
    campoBusca.value = "";
    filtroValor.value = "todos";
    salvarPreferencias({ cidade: undefined, valor: "todos" });
    marcarAba();
    renderizar();
  });

  grade.addEventListener("click", async (e) => {
    const botao = e.target.closest(".botao-salvar-evento");
    if (!botao) {
      return;
    }
    botao.disabled = true;
    try {
      const salvo = await alternarSalvo(botao.dataset.eventoId);
      if (usuario) {
        mostrarAviso(salvo ? "Evento salvo na sua agenda." : "Evento removido da agenda.");
      }
    } catch (erro) {
      mostrarAviso(erro.message, "erro");
    } finally {
      botao.disabled = false;
    }
  });
  document.addEventListener("vda:salvos", () => {
    grade.querySelectorAll(".botao-salvar-evento").forEach((botao) => atualizarBotaoSalvar(botao, estaSalvo(botao.dataset.eventoId)));
  });

  iniciarModalEvento((id) => eventos.find((evento) => evento.id === id));
}
