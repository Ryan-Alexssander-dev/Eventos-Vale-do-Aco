// Rotas de e-mail DESTE projeto (app/routers/emailRoutes.js): código de verificação e e-mail de inscrição.
// Funcionam com o servidor Node; o envio usa o SMTP configurado no .env.

import { configuracao } from "./configuracao.js";
import { requisitar } from "./api.js";

const base = () => configuracao.caminhos.email;

// finalidade: "cadastro" | "recuperacao"
export async function enviarCodigoVerificacao({ email, nome = "", finalidade }) {
  return requisitar(`${base()}/codigo`, { metodo: "POST", corpo: { email, nome, finalidade } });
}

// Devolve { tokenVerificacao } quando o código está certo.
export async function verificarCodigo({ email, finalidade, codigo }) {
  return requisitar(`${base()}/verificar`, { metodo: "POST", corpo: { email, finalidade, codigo } });
}

export async function enviarEmailInscricao({ email, nome, evento }) {
  return requisitar(`${base()}/inscricao`, {
    metodo: "POST",
    corpo: {
      email,
      nome,
      evento: { titulo: evento.titulo, data: evento.data, hora: evento.hora, local: evento.local, cidade: evento.cidade, preco: evento.preco },
    },
  });
}
