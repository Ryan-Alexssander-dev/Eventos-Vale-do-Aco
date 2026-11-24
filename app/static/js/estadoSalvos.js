// Controla quais eventos o usuário logado salvou (compartilhado por vitrine, modal e lista de salvos).

import { listarEventosSalvos, removerEventoSalvo, salvarEvento } from "./servicoUsuarios.js";
import { obterUsuario, irParaLogin } from "./sessao.js";

let ids = new Set();

function avisarMudanca() {
  document.querySelectorAll("#contadorSalvos").forEach((el) => (el.textContent = String(ids.size)));
  document.dispatchEvent(new CustomEvent("vda:salvos"));
}

export async function carregarSalvos() {
  const usuario = obterUsuario();
  if (!usuario) {
    return [];
  }
  const eventos = await listarEventosSalvos(usuario.id);
  ids = new Set(eventos.map((e) => e.id));
  avisarMudanca();
  return eventos;
}

export const estaSalvo = (idEvento) => ids.has(String(idEvento));

// Salva ou remove. Visitante sem login é levado ao login. Devolve true se ficou salvo.
export async function alternarSalvo(idEvento) {
  const usuario = obterUsuario();
  if (!usuario) {
    irParaLogin();
    return false;
  }
  const id = String(idEvento);
  if (ids.has(id)) {
    await removerEventoSalvo(usuario.id, id);
    ids.delete(id);
  } else {
    await salvarEvento(usuario.id, id);
    ids.add(id);
  }
  avisarMudanca();
  return ids.has(id);
}
