// Validação dos dados recebidos pelas rotas de e-mail. Funções puras: devolvem { valido, dados } ou { valido: false, mensagem }.

const FINALIDADES = ["cadastro", "recuperacao"];
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const texto = (valor, max) => (typeof valor === "string" ? valor.replace(/[\r\n\t]+/g, " ").trim().slice(0, max) : "");

function validarEmail(valor) {
  const email = texto(valor, 255).toLowerCase();
  return REGEX_EMAIL.test(email) ? email : null;
}

function validarPedidoCodigo(corpo) {
  const email = validarEmail(corpo?.email);
  if (!email) return { valido: false, mensagem: "Informe um e-mail válido." };
  if (!FINALIDADES.includes(corpo?.finalidade)) return { valido: false, mensagem: "Finalidade inválida." };
  return { valido: true, dados: { email, finalidade: corpo.finalidade, nome: texto(corpo?.nome, 50) } };
}

function validarConferenciaCodigo(corpo) {
  const email = validarEmail(corpo?.email);
  if (!email) return { valido: false, mensagem: "Informe um e-mail válido." };
  if (!FINALIDADES.includes(corpo?.finalidade)) return { valido: false, mensagem: "Finalidade inválida." };
  if (!/^\d{6}$/.test(String(corpo?.codigo ?? ""))) return { valido: false, mensagem: "Digite os 6 dígitos do código." };
  return { valido: true, dados: { email, finalidade: corpo.finalidade, codigo: String(corpo.codigo) } };
}

function validarPedidoInscricao(corpo) {
  const email = validarEmail(corpo?.email);
  if (!email) return { valido: false, mensagem: "Informe um e-mail válido." };
  const evento = corpo?.evento ?? {};
  const titulo = texto(evento.titulo, 200);
  if (titulo.length < 3) return { valido: false, mensagem: "Dados do evento inválidos." };
  const preco = Number(evento.preco);
  return {
    valido: true,
    dados: {
      email,
      nome: texto(corpo?.nome, 50),
      evento: {
        titulo,
        data: /^\d{4}-\d{2}-\d{2}$/.test(evento.data ?? "") ? evento.data : "",
        hora: /^\d{2}:\d{2}$/.test(evento.hora ?? "") ? evento.hora : "",
        local: texto(evento.local, 255),
        cidade: texto(evento.cidade, 60),
        preco: Number.isFinite(preco) && preco >= 0 && preco <= 99999.99 ? preco : 0,
      },
    },
  };
}

module.exports = { FINALIDADES, validarEmail, validarPedidoCodigo, validarConferenciaCodigo, validarPedidoInscricao };
