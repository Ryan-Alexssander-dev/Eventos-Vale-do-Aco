// Criação segura de elementos: o texto entra sempre por textContent (nunca como HTML),
// então nada digitado por usuários ou organizadores consegue executar código na página.

export function criarElemento(tag, { classe, texto, atributos = {}, dados = {} } = {}, ...filhos) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  for (const [nome, valor] of Object.entries(atributos)) elemento.setAttribute(nome, valor);
  for (const [nome, valor] of Object.entries(dados)) elemento.dataset[nome] = valor;
  elemento.append(...filhos.filter(Boolean));
  return elemento;
}

export function icone(nome, classe = "") {
  return criarElemento("i", { classe: `bi bi-${nome} ${classe}`.trim(), atributos: { "aria-hidden": "true" } });
}

export function esvaziar(elemento) {
  elemento.replaceChildren();
}

// Só aceita endereços http(s); qualquer outra coisa (javascript:, data:...) vira "".
export function linkSeguro(url) {
  try {
    const endereco = new URL(url);
    return ["http:", "https:"].includes(endereco.protocol) ? endereco.href : "";
  } catch {
    return "";
  }
}
