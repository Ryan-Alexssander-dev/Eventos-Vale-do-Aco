// Fluxo de inscrição.
//   evento gratuito -> registra a inscrição e confirma na hora
//   evento pago     -> segue para /pagamento; ao concluir, registra e confirma

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

// Registra a inscrição e abre a tela de confirmação.
export async function concluirInscricao(evento, usuario) {
  await registrarInscricao(evento.id, usuario.id);
  window.location.href = `/inscricao-confirmada?evento=${encodeURIComponent(evento.id)}`;
}
