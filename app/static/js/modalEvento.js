// Janela de detalhes do evento (compartilhada por vitrine e eventos salvos).
// O Bootstrap abre o modal sozinho pelos botões "Ver detalhes"; aqui só preenchemos os campos.

import { capaPadrao, preencherPublicador, rotuloCategoria } from "./componentes.js";
import { linkSeguro } from "./elementos.js";
import { eventoJaAconteceu, formatarDataHora, formatarPreco } from "./formatacao.js";
import { alternarSalvo, estaSalvo } from "./estadoSalvos.js";
import { iniciarInscricao } from "./fluxoInscricao.js";
import { mostrarAviso } from "./interface.js";

export function iniciarModalEvento(obterEventoPorId) {
  const modal = document.getElementById("modalEvento");
  if (!modal) return;
  const $ = (id) => document.getElementById(id);
  let eventoAtual = null;

  function atualizarSalvar() {
    if (!eventoAtual) return;
    const salvo = estaSalvo(eventoAtual.id);
    const botao = $("modalBotaoSalvar");
    botao.setAttribute("aria-pressed", String(salvo));
    botao.querySelector("i").className = `bi ${salvo ? "bi-star-fill" : "bi-star"} me-1`;
    botao.querySelector("span").textContent = salvo ? "Salvo na agenda" : "Salvar na agenda";
  }

  modal.addEventListener("show.bs.modal", (e) => {
    eventoAtual = obterEventoPorId(e.relatedTarget?.dataset.eventoId);
    if (!eventoAtual) return;
    const evento = eventoAtual;

    $("modalCidade").textContent = evento.cidade;
    $("modalTitulo").textContent = evento.titulo;
    $("modalCapa").src = evento.capa || capaPadrao;
    $("modalCapa").alt = `Capa do evento ${evento.titulo}`;
    $("modalData").textContent = formatarDataHora(evento);
    $("modalLocal").textContent = evento.local;
    $("modalCategoria").textContent = rotuloCategoria(evento.categoria) || "—";
    const valor = $("modalValor");
    valor.textContent = formatarPreco(evento.preco);
    valor.classList.toggle("texto-gratis", evento.gratuito);
    $("modalDescricao").textContent = evento.descricao;
    preencherPublicador($("modalPublicador"), evento.publicador);

    const site = linkSeguro(evento.link);
    const linkSite = $("modalLinkSite");
    linkSite.classList.toggle("d-none", !site);
    if (site) linkSite.href = site;

    const encerrado = eventoJaAconteceu(evento);
    const inscrever = $("modalBotaoInscrever");
    inscrever.disabled = encerrado;
    inscrever.querySelector("span").textContent = encerrado ? "Evento encerrado" : "Inscrever-se";
    atualizarSalvar();
  });

  $("modalBotaoSalvar").addEventListener("click", async (e) => {
    if (!eventoAtual) return;
    const botao = e.currentTarget; // currentTarget vira null depois de um "await"
    botao.disabled = true;
    try {
      const salvo = await alternarSalvo(eventoAtual.id);
      mostrarAviso(salvo ? "Evento salvo na sua agenda." : "Evento removido da agenda.");
    } catch (erro) {
      mostrarAviso(erro.message, "erro");
    } finally {
      botao.disabled = false;
    }
  });

  $("modalBotaoInscrever").addEventListener("click", async (e) => {
    if (!eventoAtual) return;
    const botao = e.currentTarget;
    botao.disabled = true;
    try {
      await iniciarInscricao(eventoAtual);
    } catch (erro) {
      mostrarAviso(erro.message, "erro");
      botao.disabled = false;
    }
  });

  document.addEventListener("vda:salvos", atualizarSalvar);
}
