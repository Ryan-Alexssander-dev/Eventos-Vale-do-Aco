
export function formatarCnpj(valor) {
  const d = String(valor ?? "").replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}


export function aplicarMascara(campo, formatador) {
  if (!campo) {
    return;
  }
  campo.addEventListener("input", () => {
    campo.value = formatador(campo.value);
  });
  campo.value = formatador(campo.value);
}
