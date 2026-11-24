// Envio de e-mails pelo SMTP do Google (Gmail) com o nodemailer.
// Configure SMTP_USERNAME, SMTP_PASSWORD (senha de app) e SMTP_FROM no .env.
// Em desenvolvimento, sem SMTP configurado, o e-mail NÃO é enviado: o texto aparece no console do servidor.

const config = require("../config");

let transporte = null;

class ErroEmail extends Error {}

// Permite trocar o transporte (testes automatizados).
function definirTransporte(novoTransporte) {
  transporte = novoTransporte;
}

const emailConfigurado = () => Boolean(config.smtp.username && config.smtp.password);

function obterTransporte() {
  if (!transporte) {
    const nodemailer = require("nodemailer");
    transporte = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.username, pass: config.smtp.password },
    });
  }
  return transporte;
}

async function enviarEmail({ para, assunto, texto, html }) {
  if (!emailConfigurado() && !transporte) {
    if (config.isProduction) throw new ErroEmail("SMTP não configurado.");
    console.warn(`[email — desenvolvimento] SMTP não configurado; nada foi enviado.\nPara: ${para}\nAssunto: ${assunto}\n${texto}\n`);
    return { enviado: false, simulado: true };
  }
  try {
    await obterTransporte().sendMail({ from: config.smtp.from || config.smtp.username, to: para, subject: assunto, text: texto, html });
  } catch (erro) {
    // Não registra o conteúdo do e-mail (pode ter código de verificação).
    console.error(`[email] falha no envio: ${erro.code ?? erro.message}`);
    throw new ErroEmail("Falha ao enviar o e-mail.");
  }
  return { enviado: true, simulado: false };
}

// ---------------------------------------------------------------------------------------------
const escaparHtml = (valor) =>
  String(valor).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const formatarData = (iso) => (iso ? iso.split("-").reverse().join("/") : "");
const formatarPreco = (preco) => (preco > 0 ? preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Gratuito");

function moldura(titulo, conteudoHtml) {
  return `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e7eb;border-top:4px solid #0d6efd;border-radius:8px">
<tr><td style="padding:24px 28px 8px;font-size:18px;font-weight:bold">Eventos <span style="color:#0d6efd">Vale do Aço</span></td></tr>
<tr><td style="padding:8px 28px 28px;font-size:15px;line-height:1.55"><h1 style="font-size:20px;margin:8px 0 12px">${escaparHtml(titulo)}</h1>${conteudoHtml}</td></tr>
</table>
<p style="font-size:12px;color:#6b7280;margin:16px 0 0">Você recebeu este e-mail porque usou o Eventos Vale do Aço.</p>
</td></tr></table></body></html>`;
}

function montarEmailCodigo({ nome, codigo, minutos, finalidade }) {
  const saudacao = nome ? `Olá, ${nome}!` : "Olá!";
  const motivo = finalidade === "recuperacao" ? "redefinir a sua senha" : "confirmar o seu e-mail";
  const texto = `${saudacao}\n\nSeu código para ${motivo} é: ${codigo}\n\nEle vale por ${minutos} minutos. Se você não pediu isso, ignore esta mensagem.\n\nEventos Vale do Aço`;
  const html = moldura(
    finalidade === "recuperacao" ? "Redefinir senha" : "Confirme seu e-mail",
    `<p style="margin:0 0 12px">${escaparHtml(saudacao)} Use o código abaixo para ${motivo}:</p>
<p style="font-size:32px;letter-spacing:8px;font-weight:bold;text-align:center;background:#f3f4f6;border-radius:8px;padding:14px 0;margin:16px 0">${escaparHtml(codigo)}</p>
<p style="margin:0;color:#6b7280;font-size:13px">O código vale por ${minutos} minutos. Se você não pediu isso, ignore esta mensagem.</p>`
  );
  return { assunto: "Seu código de verificação — Eventos Vale do Aço", texto, html };
}

function montarEmailInscricao({ nome, evento }) {
  const saudacao = nome ? `Olá, ${nome}!` : "Olá!";
  const linhas = [
    ["Evento", evento.titulo],
    ["Data e hora", [formatarData(evento.data), evento.hora].filter(Boolean).join(" • ")],
    ["Local", [evento.local, evento.cidade].filter(Boolean).join(" — ")],
    ["Valor", formatarPreco(evento.preco)],
  ].filter(([, valor]) => valor);
  const texto = `${saudacao}\n\nSua inscrição foi confirmada.\n\n${linhas.map(([r, v]) => `${r}: ${v}`).join("\n")}\n\nEventos Vale do Aço`;
  const tabela = linhas
    .map(([r, v]) => `<tr><td style="padding:6px 0;color:#6b7280;width:110px">${escaparHtml(r)}</td><td style="padding:6px 0;font-weight:bold">${escaparHtml(v)}</td></tr>`)
    .join("");
  const html = moldura(
    "Inscrição confirmada!",
    `<p style="margin:0 0 12px">${escaparHtml(saudacao)} Sua inscrição foi confirmada. Veja os detalhes:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;width:100%;margin:12px 0">${tabela}</table>
<p style="margin:0;color:#6b7280;font-size:13px">Guarde este e-mail. Nos vemos no evento!</p>`
  );
  return { assunto: `Inscrição confirmada: ${evento.titulo.replace(/[\r\n]+/g, " ")}`, texto, html };
}

async function enviarCodigo({ para, nome, codigo, minutos, finalidade }) {
  return enviarEmail({ para, ...montarEmailCodigo({ nome, codigo, minutos, finalidade }) });
}

async function enviarConfirmacaoInscricao({ para, nome, evento }) {
  return enviarEmail({ para, ...montarEmailInscricao({ nome, evento }) });
}

module.exports = { enviarEmail, enviarCodigo, enviarConfirmacaoInscricao, montarEmailCodigo, montarEmailInscricao, definirTransporte, emailConfigurado, ErroEmail };
