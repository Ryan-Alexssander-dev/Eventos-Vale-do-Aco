// Serviço centralizado para envio de mensagens por e-mail.

const { getSetting } = require("../config");

async function sendEmail(recipient, subject, body) {
  const host = getSetting("SMTP_HOST");
  const sender = getSetting("SMTP_FROM");

  if (!host || !sender) {
    throw new Error("Configure SMTP_HOST e SMTP_FROM para enviar e-mails.");
  }

  throw new Error("Configure o cliente SMTP para enviar e-mails.");
}

module.exports = { sendEmail };