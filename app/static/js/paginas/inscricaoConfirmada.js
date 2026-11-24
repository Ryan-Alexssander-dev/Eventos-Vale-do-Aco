// Confirmação da inscrição.

import { formatarDataHora, formatarPreco } from "../formatacao.js";
import { iniciarPagina, mostrarAlerta } from "../interface.js";
import { buscarEvento } from "../servicoEventos.js";

const { continuar } = iniciarPagina({ exigir: "logado" });
if (continuar) iniciar();

async function iniciar() {
  const consulta = new URLSearchParams(window.location.search);
  const emailEnviado = consulta.get("email") !== "0";
  const $ = (id) => document.getElementById(id);

  try {
    const evento = await buscarEvento(consulta.get("evento"));
    $("confirmacaoEvento").textContent = evento.titulo;
    $("confirmacaoData").textContent = formatarDataHora(evento);
    $("confirmacaoLocal").textContent = `${evento.local} — ${evento.cidade}`;
    $("confirmacaoValor").textContent = formatarPreco(evento.preco);
    $("confirmacaoValor").classList.toggle("texto-gratis", evento.gratuito);
    $("detalhesConfirmacao").classList.remove("d-none");
  } catch {
    /* sem os detalhes, mostra só a mensagem */
  }

  $("textoEmailConfirmacao").classList.toggle("d-none", !emailEnviado);
  if (!emailEnviado) mostrarAlerta("Sua inscrição foi registrada, mas não conseguimos enviar o e-mail de confirmação agora.", "info");
}
