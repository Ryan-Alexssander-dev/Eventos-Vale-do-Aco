// Tela de pagamento dos eventos pagos. Os campos do cartão NÃO são lidos, validados, armazenados nem enviados.

import { concluirInscricao } from "../fluxoInscricao.js";
import { eventoJaAconteceu, formatarDataHora, formatarPreco } from "../formatacao.js";
import { definirCarregando, iniciarPagina, mostrarAlerta } from "../interface.js";
import { buscarEvento } from "../servicoEventos.js";

const { continuar, usuario } = iniciarPagina({ exigir: "logado" });
if (continuar) {
  iniciar(usuario);
}

async function iniciar(usuario) {
  const idEvento = new URLSearchParams(window.location.search).get("evento");
  let evento;
  try {
    evento = await buscarEvento(idEvento);
  } catch {
    window.location.replace("/home");
    return;
  }
  // Gratuito ou já encerrado: não há o que pagar.
  if (evento.gratuito || eventoJaAconteceu(evento)) {
    window.location.replace("/home");
    return;
  }

  const $ = (id) => document.getElementById(id);
  $("pagamentoTitulo").textContent = evento.titulo;
  $("pagamentoData").textContent = formatarDataHora(evento);
  $("pagamentoLocal").textContent = `${evento.local} — ${evento.cidade}`;
  $("pagamentoValor").textContent = formatarPreco(evento.preco);
  $("pagamentoTotal").textContent = formatarPreco(evento.preco);
  $("botaoPagarValor").textContent = formatarPreco(evento.preco);

  $("formularioPagamento").addEventListener("submit", async (e) => {
    e.preventDefault();
    const botao = $("botaoEnviar");
    definirCarregando(botao, true, "Processando pagamento...");
    // Pequena espera só para dar a sensação de processamento.
    await new Promise((resolver) => setTimeout(resolver, 1500));
    try {
      await concluirInscricao(evento, usuario);
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
      definirCarregando(botao, false);
    }
  });
}
