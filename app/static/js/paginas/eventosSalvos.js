// Eventos salvos: filtros, divisão por mês e seção dos que já aconteceram.

import { criarLinhaEvento, rotuloCategoria } from "../componentes.js";
import { criarElemento } from "../elementos.js";
import { alternarSalvo, carregarSalvos } from "../estadoSalvos.js";
import { dataLocal, eventoJaAconteceu, hoje, pluralizar, rotuloMes } from "../formatacao.js";
import { atrasar, iniciarPagina, mostrarAlerta, mostrarAviso } from "../interface.js";
import { iniciarModalEvento } from "../modalEvento.js";
import { lerPreferencias, salvarPreferencias } from "../preferencias.js";

const { continuar } = iniciarPagina({ exigir: "logado" });
if (continuar) {
  iniciar();
}

const semAcentos = (texto) => String(texto).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

async function iniciar() {
  const formulario = document.getElementById("formularioFiltrosSalvos");
  const campos = {
    busca: document.getElementById("buscaSalvos"),
    cidade: document.getElementById("cidadeSalvos"),
    categoria: document.getElementById("categoriaSalvos"),
    valor: document.getElementById("valorSalvos"),
    periodo: document.getElementById("periodoSalvos"),
  };
  const grupos = document.getElementById("gruposSalvos");
  const secaoPassados = document.getElementById("secaoPassados");
  const listaPassados = document.getElementById("listaPassados");
  const botaoPassados = document.getElementById("botaoPassadosTexto");
  const blocoPassados = document.getElementById("blocoPassados");
  const total = document.getElementById("totalSalvos");
  const vazioSalvos = document.getElementById("estadoVazioSalvos");
  const vazioFiltros = document.getElementById("estadoVazioFiltros");

  let salvos = [];

  const padrao = lerPreferencias().salvos;
  for (const nome of ["cidade", "categoria", "valor", "periodo"]) campos[nome].value = padrao[nome];

  function lerFiltros() {
    return { busca: campos.busca.value, cidade: campos.cidade.value, categoria: campos.categoria.value, valor: campos.valor.value, periodo: campos.periodo.value };
  }

  function passaNoPeriodo(evento, periodo) {
    const data = dataLocal(evento.data);
    const base = hoje();
    if (periodo === "7dias") {
      const limite = new Date(base);
      limite.setDate(limite.getDate() + 7);
      return data >= base && data <= limite;
    }
    if (periodo === "mes") {
      return data >= base && data.getMonth() === base.getMonth() && data.getFullYear() === base.getFullYear();
    }
    if (periodo === "passados") {
      return data < base;
    }
    return true;
  }

  function filtrar(filtros) {
    const termo = semAcentos(filtros.busca.trim());
    return salvos.filter((evento) => {
      if (filtros.cidade !== "todas" && evento.cidade !== filtros.cidade) {
        return false;
      }
      if (filtros.categoria !== "todas" && evento.categoria !== filtros.categoria) {
        return false;
      }
      if (filtros.valor === "gratuito" && !evento.gratuito) {
        return false;
      }
      if (filtros.valor === "pago" && evento.gratuito) {
        return false;
      }
      if (!passaNoPeriodo(evento, filtros.periodo)) {
        return false;
      }
      if (!termo) {
        return true;
      }
      return semAcentos([evento.titulo, evento.local, evento.descricao, evento.cidade, rotuloCategoria(evento.categoria)].join(" ")).includes(termo);
    });
  }

  function criarGrupoDoMes(chave, eventos) {
    const id = `salvos-${chave}`;
    return criarElemento(
      "section",
      { classe: "grupo-salvos", atributos: { id, "aria-labelledby": `${id}-titulo` } },
      criarElemento("div", { classe: "divisor-data" }, criarElemento("h2", { texto: rotuloMes(`${chave}-01`), atributos: { id: `${id}-titulo` } }), criarElemento("span", { classe: "badge etiqueta-cidade", texto: pluralizar(eventos.length, "evento", "eventos") })),
      criarElemento("div", { classe: "d-flex flex-column gap-3" }, ...eventos.map(criarLinhaEvento))
    );
  }

  function renderizar() {
    const filtros = lerFiltros();
    const lista = filtrar(filtros).sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));
    const futuros = lista.filter((e) => !eventoJaAconteceu(e));
    const passados = lista.filter(eventoJaAconteceu).reverse();

    const porMes = new Map();
    for (const evento of futuros) {
      const chave = evento.data.slice(0, 7);
      porMes.set(chave, [...(porMes.get(chave) ?? []), evento]);
    }
    grupos.replaceChildren(...[...porMes].map(([chave, eventos]) => criarGrupoDoMes(chave, eventos)));

    listaPassados.replaceChildren(...passados.map(criarLinhaEvento));
    secaoPassados.classList.toggle("d-none", passados.length === 0);
    botaoPassados.textContent = `Eventos que já aconteceram (${passados.length})`;
    if (filtros.periodo === "passados" && passados.length) {
      window.bootstrap.Collapse.getOrCreateInstance(blocoPassados, { toggle: false }).show();
    }

    total.textContent = pluralizar(salvos.length, "evento salvo", "eventos salvos");
    vazioSalvos.classList.toggle("d-none", salvos.length > 0);
    vazioFiltros.classList.toggle("d-none", salvos.length === 0 || lista.length > 0);
  }

  function aoFiltrar() {
    const { cidade, categoria, valor, periodo } = lerFiltros();
    salvarPreferencias({ salvos: { cidade, categoria, valor, periodo } });
    renderizar();
  }

  try {
    salvos = await carregarSalvos();
    renderizar();
  } catch (erro) {
    mostrarAlerta(erro.message, "erro");
  }

  campos.busca.addEventListener("input", atrasar(renderizar));
  ["cidade", "categoria", "valor", "periodo"].forEach((nome) => campos[nome].addEventListener("change", aoFiltrar));
  formulario.addEventListener("submit", (e) => e.preventDefault());
  formulario.addEventListener("reset", () => setTimeout(aoFiltrar));

  document.getElementById("paginaSalvos").addEventListener("click", async (e) => {
    const botao = e.target.closest("[data-remover-salvo]");
    if (!botao) {
      return;
    }
    botao.disabled = true;
    try {
      await alternarSalvo(botao.dataset.removerSalvo);
      salvos = salvos.filter((evento) => evento.id !== botao.dataset.removerSalvo);
      renderizar();
      mostrarAviso("Evento removido da sua agenda.");
    } catch (erro) {
      botao.disabled = false;
      mostrarAviso(erro.message, "erro");
    }
  });

  iniciarModalEvento((id) => salvos.find((evento) => evento.id === id));
}
