// Avatares padronizados (animais). O usuário escolhe um; não há envio de foto do dispositivo.
// O que vai para a API é só o identificador (ex.: "raposa").

import { criarElemento } from "./elementos.js";

export const avatares = [
  { id: "raposa", nome: "Raposa" },
  { id: "gato", nome: "Gato" },
  { id: "cachorro", nome: "Cachorro" },
  { id: "coruja", nome: "Coruja" },
  { id: "panda", nome: "Panda" },
  { id: "coala", nome: "Coala" },
  { id: "leao", nome: "Leão" },
  { id: "sapo", nome: "Sapo" },
  { id: "pinguim", nome: "Pinguim" },
  { id: "urso", nome: "Urso" },
  { id: "coelho", nome: "Coelho" },
  { id: "tigre", nome: "Tigre" },
];

export const avatarPadrao = "/static/img/avatar-padrao.svg";

export function urlAvatar(id) {
  return avatares.some((avatar) => avatar.id === id) ? `/static/img/avatares/${id}.svg` : avatarPadrao;
}

export function avatarAleatorio() {
  return avatares[Math.floor(Math.random() * avatares.length)].id;
}

export function montarSeletorAvatares(container, selecionado, aoMudar = () => {}) {
  container.replaceChildren();
  for (const avatar of avatares) {
    const entrada = criarElemento("input", {
      classe: "visually-hidden",
      atributos: { type: "radio", name: "avatar", value: avatar.id, id: `avatar-${avatar.id}` },
    });
    entrada.checked = avatar.id === selecionado;
    entrada.addEventListener("change", () => aoMudar(avatar.id));
    const imagem = criarElemento("img", {
      classe: "avatar",
      atributos: { src: urlAvatar(avatar.id), alt: avatar.nome, title: avatar.nome, width: 56, height: 56, loading: "lazy" },
    });
    container.append(criarElemento("label", { classe: "opcao-avatar", atributos: { for: `avatar-${avatar.id}` } }, entrada, imagem));
  }
}

export function obterAvatarSelecionado(container) {
  return container.querySelector("input[name=avatar]:checked")?.value ?? "";
}
