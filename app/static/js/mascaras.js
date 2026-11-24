// Máscaras de digitação (apenas formatação; as validações ficam em validacoes.js).

export function formatarTelefone(valor) {
  const d = String(valor ?? "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatarCnpj(valor) {
  const d = String(valor ?? "").replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function aplicarMascara(campo, formatador) {
  if (!campo) return;
  campo.addEventListener("input", () => {
    campo.value = formatador(campo.value);
  });
  campo.value = formatador(campo.value);
}
