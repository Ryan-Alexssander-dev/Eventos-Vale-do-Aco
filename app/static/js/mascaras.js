
export function formatarCnpj(valor) {
  const d = String(valor ?? "").replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatarNumeroCartao(valor) {
  const digitos = String(valor ?? "").replace(/\D/g, "").slice(0, 16);
  return digitos.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatarValidadeCartao(valor) {
  const digitos = String(valor ?? "").replace(/\D/g, "").slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}

export function formatarCvv(valor) {
  return String(valor ?? "").replace(/\D/g, "").slice(0, 4);
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
