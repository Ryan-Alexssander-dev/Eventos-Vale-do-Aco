// Utilitário de cookies. Grava sempre com Path=/, SameSite=Lax e Secure (quando o site usa HTTPS).
// Cookies são enviados em TODA requisição ao servidor: mantenha-os pequenos e poucos.

export function lerCookie(nome) {
  const par = document.cookie.split("; ").find((linha) => linha.startsWith(`${nome}=`));
  if (!par) {
    return null;
  }
  try {
    return decodeURIComponent(par.slice(nome.length + 1));
  } catch {
    return null;
  }
}

export function gravarCookie(nome, valor, { dias = 365 } = {}) {
  const partes = [`${nome}=${encodeURIComponent(valor)}`, `Max-Age=${Math.round(dias * 86400)}`, "Path=/", "SameSite=Lax"];
  if (window.location.protocol === "https:") {
    partes.push("Secure");
  }
  document.cookie = partes.join("; ");
}

export function apagarCookie(nome) {
  document.cookie = `${nome}=; Max-Age=0; Path=/; SameSite=Lax`;
}
