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

// Registra a inscrição, envia o e-mail e abre a tela de confirmação.
// Se só o e-mail falhar, a inscrição continua valendo e a tela de confirmação avisa.
export async function concluirInscricao(evento, usuario) {
  await registrarInscricao(evento.id, usuario.id);
  let emailEnviado = true;
  try {
    await enviarEmailInscricao({ email: usuario.email, nome: usuario.nome, evento });
  } catch {
    emailEnviado = false;
  }
  window.location.href = `/inscricao-confirmada?evento=${encodeURIComponent(evento.id)}&email=${emailEnviado ? 1 : 0}`;
}
