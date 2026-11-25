// Fluxo de inscrição.
//   evento gratuito -> registra a inscrição e envia o e-mail na hora, sem passar pelo pagamento
//   evento pago     -> segue para /pagamento; ao concluir, registra e envia o e-mail

import { enviarEmailInscricao } from "./servicoEmail.js";
import { registrarInscricao } from "./servicoEventos.js";
import { irParaLogin, obterUsuario } from "./sessao.js";

export async function iniciarInscricao(evento) {
  const usuario = obterUsuario();
  if (!usuario) {
    irParaLogin();
    return;
  }
  if (!evento.gratuito) {
    window.location.href = `/pagamento?evento=${encodeURIComponent(evento.id)}`;
    return;
  }
  await concluirInscricao(evento, usuario);
}

// Registra a inscrição, confirma o envio do e-mail e só então abre a tela de confirmação.
export async function concluirInscricao(evento, usuario) {
  await registrarInscricao(evento.id, usuario.id);
  const resultado = await enviarEmailInscricao({ email: usuario.email, nome: usuario.nome, evento });
  if (!resultado?.enviado) {
    throw new Error("Sua inscrição foi registrada, mas o e-mail de confirmação não foi enviado. Tente novamente.");
  }
  window.location.href = `/inscricao-confirmada?evento=${encodeURIComponent(evento.id)}&email=1`;
}
