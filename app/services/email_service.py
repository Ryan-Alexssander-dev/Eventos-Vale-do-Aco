import smtplib
from email.message import EmailMessage

from app.config import get_setting


def send_email(recipient: str, subject: str, body: str) -> None:
    host = get_setting("SMTP_HOST")
    sender = get_setting("SMTP_FROM")
    if not host or not sender:
        raise RuntimeError("Configure SMTP_HOST e SMTP_FROM para enviar e-mails.")

    try:
        port = int(get_setting("SMTP_PORT", "587"))
    except ValueError as exc:
        raise RuntimeError("SMTP_PORT deve ser um numero inteiro.") from exc

    tls_setting = get_setting("SMTP_USE_TLS", "true").lower()
    if tls_setting not in {"true", "false"}:
        raise RuntimeError("SMTP_USE_TLS deve ser true ou false.")

    username = get_setting("SMTP_USERNAME")
    password = get_setting("SMTP_PASSWORD")
    if username and not password:
        raise RuntimeError("Configure SMTP_PASSWORD quando SMTP_USERNAME estiver definido.")

    message = EmailMessage()
    message["From"] = sender
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(host, port, timeout=10) as smtp:
        if tls_setting == "true":
            smtp.starttls()
        if username:
            smtp.login(username, password)
        smtp.send_message(message)
"""Serviço centralizado para envio de mensagens por e-mail."""
