// Painel do administrador: lista os eventos e oferece a opção de publicar (e editar/excluir).

import { criarImagemCapa, criarEtiquetaPreco } from "../componentes.js";
import { criarElemento, icone } from "../elementos.js";
import {
  eventoJaAconteceu,
  formatarDataHora,
  pluralizar,
} from "../formatacao.js";
import { iniciarPagina, mostrarAlerta, mostrarAviso } from "../interface.js";
import { excluirEvento, listarEventos } from "../servicoEventos.js";

const { continuar } = iniciarPagina({ exigir: "administrador" });
if (continuar) {
  iniciar();
}

async function iniciar() {
  const corpo = document.getElementById("corpoTabelaEventos");
  const vazio = document.getElementById("estadoVazioAdmin");
  const tabela = document.getElementById("painelTabela");
  const total = document.getElementById("totalEventos");
  let eventos = [];
  let idParaExcluir = null;

  const consulta = new URLSearchParams(window.location.search);
  if (consulta.get("publicado"))
    mostrarAlerta("Evento publicado com sucesso.", "sucesso");
  if (consulta.get("editado"))
    mostrarAlerta("Evento atualizado com sucesso.", "sucesso");

  function criarLinha(evento) {
    const encerrado = eventoJaAconteceu(evento);
    const miniatura = criarImagemCapa(evento, "miniatura-capa");
    miniatura.alt = "";
    return criarElemento(
      "tr",
      { dados: { eventoId: evento.id } },
      criarElemento(
        "td",
        {},
        criarElemento(
          "div",
          { classe: "d-flex align-items-center gap-3" },
          miniatura,
          criarElemento(
            "div",
            {},
            criarElemento("div", {
              classe: "fw-semibold text-dark",
              texto: evento.titulo,
            }),
            criarElemento("div", {
              classe: "small text-secondary",
              texto: evento.cidade,
            }),
          ),
        ),
      ),
      criarElemento("td", {
        classe: "text-nowrap",
        texto: formatarDataHora(evento),
      }),
      criarElemento(
        "td",
        { classe: "text-nowrap" },
        criarEtiquetaPreco(evento),
      ),
      criarElemento(
        "td",
        {},
        criarElemento("span", {
          classe: `badge etiqueta-situacao ${encerrado ? "encerrado" : "publicado"}`,
          texto: encerrado ? "Encerrado" : "Publicado",
        }),
      ),
      criarElemento(
        "td",
        { classe: "text-end" },
        criarElemento(
          "div",
          { classe: "d-flex justify-content-end gap-2 flex-wrap" },
          criarElemento(
            "a",
            {
              classe: "btn botao-contorno btn-sm",
              atributos: {
                href: `/publicar-evento?id=${encodeURIComponent(evento.id)}`,
              },
            },
            icone("pencil", "me-1"),
            "Editar",
          ),

          criarElemento("button", {
            classe: "btn botao-perigo-contorno btn-sm",
            texto: "Excluir",
            atributos: {
              type: "button",
              "data-bs-toggle": "modal",
              "data-bs-target": "#modalExcluirEvento",
            },
            dados: { eventoId: evento.id },
          }),
        ),
      ),
    );
  }

  function renderizar() {
    corpo.replaceChildren(...eventos.map(criarLinha));
    tabela.classList.toggle("d-none", eventos.length === 0);
    vazio.classList.toggle("d-none", eventos.length > 0);
    total.textContent = pluralizar(eventos.length, "evento", "eventos");
  }

  try {
    eventos = (await listarEventos()).sort((a, b) =>
      `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`),
    );
    renderizar();
  } catch (erro) {
    mostrarAlerta(erro.message, "erro");
  }

  document
    .getElementById("modalExcluirEvento")
    .addEventListener("show.bs.modal", (e) => {
      idParaExcluir = e.relatedTarget?.dataset.eventoId ?? null;
      document.getElementById("nomeEventoExcluir").textContent =
        eventos.find((ev) => ev.id === idParaExcluir)?.titulo ?? "este evento";
    });

  document
    .getElementById("botaoConfirmarExclusao")
    .addEventListener("click", async (e) => {
      if (!idParaExcluir) {
        return;
      }
      const botao = e.currentTarget; // currentTarget vira null depois de um "await"
      botao.disabled = true;
      try {
        await excluirEvento(idParaExcluir);
        eventos = eventos.filter((ev) => ev.id !== idParaExcluir);
        renderizar();
        window.bootstrap.Modal.getInstance(
          document.getElementById("modalExcluirEvento"),
        ).hide();
        mostrarAviso("Evento excluído.");
      } catch (erro) {
        mostrarAviso(erro.message, "erro");
      } finally {
        botao.disabled = false;
      }
    });
}
