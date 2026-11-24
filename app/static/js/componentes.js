// Peças de tela reutilizadas: cartão de evento, linha da lista de salvos e bloco "publicado por".

import { urlAvatar } from "./avatares.js";
import { configuracao } from "./configuracao.js";
import { criarElemento, icone } from "./elementos.js";
import { eventoJaAconteceu, formatarDataHora, formatarPreco, partesDaData } from "./formatacao.js";

export const capaPadrao = "/static/img/capa-padrao.svg";

export function criarImagemCapa(evento, classe = "") {
  const imagem = criarElemento("img", {
    classe,
    atributos: { src: evento.capa || capaPadrao, alt: `Capa do evento ${evento.titulo}`, loading: "lazy" },
  });
  imagem.addEventListener("error", () => (imagem.src = capaPadrao), { once: true });
  return imagem;
}

export function criarEtiquetaPreco(evento) {
  return criarElemento("span", { classe: `badge ${evento.gratuito ? "etiqueta-gratis" : "etiqueta-preco"}`, texto: formatarPreco(evento.preco) });
}

export function criarBotaoSalvar(evento, salvo) {
  const botao = criarElemento(
    "button",
    {
      classe: `botao-salvar-evento${salvo ? " salvo" : ""}`,
      atributos: { type: "button", "aria-pressed": String(salvo), title: salvo ? "Remover da agenda" : "Salvar na agenda", "aria-label": `${salvo ? "Remover" : "Salvar"} ${evento.titulo} ${salvo ? "da" : "na"} agenda` },
      dados: { eventoId: evento.id },
    },
    icone(salvo ? "star-fill" : "star")
  );
  return botao;
}

export function atualizarBotaoSalvar(botao, salvo) {
  botao.classList.toggle("salvo", salvo);
  botao.setAttribute("aria-pressed", String(salvo));
  botao.title = salvo ? "Remover da agenda" : "Salvar na agenda";
  botao.querySelector("i").className = `bi ${salvo ? "bi-star-fill" : "bi-star"}`;
}

export function criarBotaoDetalhes(evento, classe) {
  return criarElemento("button", {
    classe,
    texto: "Ver detalhes",
    atributos: { type: "button", "data-bs-toggle": "modal", "data-bs-target": "#modalEvento" },
    dados: { eventoId: evento.id },
  });
}

export function criarCartaoEvento(evento, salvo) {
  return criarElemento(
    "div",
    { classe: "col-md-6 col-lg-4", dados: { eventoId: evento.id } },
    criarElemento(
      "article",
      { classe: "cartao-evento h-100 d-flex flex-column" },
      criarElemento("div", { classe: "capa-evento" }, criarImagemCapa(evento)),
      criarElemento(
        "div",
        { classe: "cartao-evento-corpo d-flex flex-column flex-grow-1" },
        criarElemento("div", { classe: "d-flex justify-content-between align-items-center gap-2 mb-3" }, criarElemento("span", { classe: "badge etiqueta-cidade", texto: evento.cidade }), criarEtiquetaPreco(evento)),
        criarElemento("h3", { classe: "h6 fw-bold text-dark mb-2", texto: evento.titulo }),
        criarElemento(
          "p",
          { classe: "small text-secondary mb-2" },
          icone("calendar-event", "me-1"),
          criarElemento("time", { atributos: { datetime: `${evento.data}${evento.hora ? `T${evento.hora}` : ""}` }, texto: formatarDataHora(evento) }),
          ` • ${evento.local}`
        ),
        criarElemento("p", { classe: "small text-secondary flex-grow-1 mb-3", texto: evento.descricao }),
        criarElemento("div", { classe: "d-flex gap-2 pt-3 border-top" }, criarBotaoDetalhes(evento, "btn botao-escuro btn-sm flex-grow-1"), criarBotaoSalvar(evento, salvo))
      )
    )
  );
}

export function criarLinhaEvento(evento) {
  const { dia, mes, semana } = partesDaData(evento.data);
  const passado = eventoJaAconteceu(evento);
  return criarElemento(
    "article",
    { classe: `linha-evento${passado ? " passado" : ""}`, dados: { eventoId: evento.id } },
    criarElemento(
      "div",
      { classe: "d-flex flex-column flex-md-row align-items-md-center gap-3" },
      criarElemento("div", { classe: "bloco-data", atributos: { "aria-hidden": "true" } }, criarElemento("div", { classe: "bloco-data-mes", texto: mes }), criarElemento("div", { classe: "bloco-data-dia", texto: dia }), criarElemento("div", { classe: "bloco-data-semana", texto: semana })),
      criarElemento(
        "div",
        { classe: "linha-evento-corpo flex-grow-1" },
        criarElemento("div", { classe: "d-flex flex-wrap align-items-center gap-2 mb-2" }, criarElemento("span", { classe: "badge etiqueta-cidade", texto: evento.cidade }), criarEtiquetaPreco(evento), criarElemento("span", { classe: "small text-secondary", texto: rotuloCategoria(evento.categoria) })),
        criarElemento("h3", { classe: "h6 fw-bold text-dark mb-1", texto: evento.titulo }),
        criarElemento("p", { classe: "small text-secondary mb-0" }, icone("clock", "me-1"), evento.hora || "Horário a confirmar", icone("geo-alt", "ms-2 me-1"), evento.local)
      ),
      criarElemento(
        "div",
        { classe: "d-flex gap-2 flex-shrink-0" },
        criarBotaoDetalhes(evento, "btn botao-escuro btn-sm"),
        criarElemento("button", { classe: "btn botao-contorno btn-sm", atributos: { type: "button", title: "Remover dos salvos", "aria-label": `Remover ${evento.titulo} dos salvos` }, dados: { removerSalvo: evento.id } }, icone("star-fill", "text-warning"))
      )
    )
  );
}

export function rotuloCategoria(valor) {
  return configuracao.categorias.find((c) => c.valor === valor)?.nome ?? "";
}

// "Publicado por um administrador" ou, quando é de um organizador, o perfil dele (avatar + nome).
export function preencherPublicador(container, publicador) {
  container.replaceChildren();
  if (publicador?.tipo === configuracao.tiposUsuario.organizador && publicador.nome) {
    container.append(
      criarElemento("span", { texto: "Publicado por" }),
      criarElemento("img", { classe: "avatar avatar-pequeno", atributos: { src: urlAvatar(publicador.avatar), alt: "", width: 32, height: 32 } }),
      criarElemento("strong", { classe: "text-dark", texto: publicador.nome })
    );
    return;
  }
  container.append(icone("shield-check", "text-primary"), criarElemento("span", { texto: "Publicado por um administrador" }));
}
