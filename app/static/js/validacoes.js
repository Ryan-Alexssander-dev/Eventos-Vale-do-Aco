// Validações de dados. Cada função devolve "" (válido) ou a mensagem de erro.
// O servidor DEVE repetir estas regras: a validação do navegador é só conforto para quem usa.

import { configuracao } from "./configuracao.js";

export const somenteDigitos = (texto) => String(texto ?? "").replace(/\D/g, "");

export function validarNome(valor) {
  const nome = String(valor ?? "").trim().replace(/\s+/g, " ");
  if (nome.length < 2) {
    return "Informe seu nome.";
  }
  if (nome.length > 50) {
    return "O nome pode ter no máximo 50 caracteres.";
  }
  if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(nome)) {
    return "Use apenas letras no nome.";
  }
  return "";
}

export function validarNomeOrganizacao(valor) {
  const nome = String(valor ?? "").trim();
  if (nome.length < 2) {
    return "Informe o nome da organização.";
  }
  if (nome.length > 50) {
    return "O nome pode ter no máximo 50 caracteres.";
  }
  return "";
}

export function validarEmail(valor) {
  const email = String(valor ?? "").trim();
  if (!email) {
    return "Informe seu e-mail.";
  }
  if (email.length > 255) {
    return "O e-mail é muito longo.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return "Insira um e-mail válido.";
  }
  return "";
}

export function validarTelefone(valor) {
  const digitos = somenteDigitos(valor);
  if (!digitos) {
    return "Informe o telefone com DDD.";
  }
  if (digitos.length < 10 || digitos.length > 11) {
    return "Informe DDD + número (10 ou 11 dígitos).";
  }
  if (Number(digitos.slice(0, 2)) < 11) {
    return "O DDD informado não é válido.";
  }
  if (digitos.length === 11 && digitos[2] !== "9") {
    return "Celulares começam com 9 depois do DDD.";
  }
  return "";
}

export function validarSenhaNova(valor) {
  const senha = String(valor ?? "");
  if (senha.length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }
  if (senha.length > 72) {
    return "A senha pode ter no máximo 72 caracteres.";
  }
  if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
    return "Use letras e números na senha.";
  }
  return "";
}

export function validarSenhaPreenchida(valor) {
  return String(valor ?? "") ? "" : "Digite a sua senha.";
}

export function validarConfirmacao(valor, original) {
  return valor === original && valor !== "" ? "" : "As senhas precisam ser iguais.";
}

export function validarAceite(marcado) {
  return marcado ? "" : "Você precisa aceitar para continuar.";
}

export function validarCodigo(valor) {
  return /^\d{6}$/.test(String(valor ?? "")) ? "" : "Digite os 6 dígitos do código.";
}

export function validarCnpj(valor) {
  const c = somenteDigitos(valor);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) {
    return "Informe um CNPJ válido.";
  }
  const digito = (base) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = [...base].reduce((soma, d, i) => soma + Number(d) * pesos[i], 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = digito(c.slice(0, 12));
  const d2 = digito(c.slice(0, 12) + d1);
  return c.endsWith(`${d1}${d2}`) ? "" : "Informe um CNPJ válido.";
}

export function validarTituloEvento(valor) {
  const texto = String(valor ?? "").trim();
  if (texto.length < 3) {
    return "Informe o nome do evento (mínimo 3 caracteres).";
  }
  if (texto.length > 200) {
    return "O nome pode ter no máximo 200 caracteres.";
  }
  return "";
}

export function validarDescricaoEvento(valor) {
  const texto = String(valor ?? "").trim();
  if (texto.length < 10) {
    return "Descreva o evento (mínimo 10 caracteres).";
  }
  if (texto.length > 255) {
    return "A descrição pode ter no máximo 255 caracteres.";
  }
  return "";
}

export function validarCategoria(valor) {
  return configuracao.categorias.some((c) => c.valor === valor) ? "" : "Escolha uma categoria.";
}

export function validarCidade(valor) {
  return configuracao.cidades.includes(valor) ? "" : "Escolha a cidade.";
}

export function validarDataEvento(valor, { permitirPassado = false } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor ?? "")) {
    return "Informe a data do evento.";
  }
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return "Data inválida.";
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (!permitirPassado && data < hoje) {
    return "A data não pode estar no passado.";
  }
  if (ano > hoje.getFullYear() + 5) {
    return "Data muito distante.";
  }
  return "";
}

export function validarHoraEvento(valor) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor ?? "") ? "" : "Informe o horário.";
}

export function validarLocalEvento(valor) {
  const texto = String(valor ?? "").trim();
  if (texto.length < 3) {
    return "Informe o local do evento.";
  }
  if (texto.length > 255) {
    return "O local pode ter no máximo 255 caracteres.";
  }
  return "";
}

export function validarPreco(valor, gratuito) {
  if (gratuito) {
    return "";
  }
  const numero = Number(String(valor ?? "").replace(",", "."));
  if (String(valor ?? "").trim() === "" || Number.isNaN(numero)) {
    return "Informe o valor do ingresso.";
  }
  if (numero <= 0) {
    return "Para evento sem custo, marque \"Evento gratuito\".";
  }
  if (numero > 99999.99) {
    return "Valor muito alto.";
  }
  return "";
}

export function validarVagas(valor) {
  if (String(valor ?? "").trim() === "") {
    return "";
  }
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 && numero <= 1000000 ? "" : "Informe um número inteiro de vagas.";
}

export function validarLinkOpcional(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto) {
    return "";
  }
  if (texto.length > 255) {
    return "O endereço é muito longo.";
  }
  try {
    const url = new URL(texto);
    return ["http:", "https:"].includes(url.protocol) ? "" : "Use um endereço que comece com http:// ou https://.";
  } catch {
    return "Informe um endereço válido (https://...).";
  }
}

export function validarImagem(arquivo, { obrigatorio = false } = {}) {
  if (!arquivo) {
    return obrigatorio ? "Escolha uma imagem." : "";
  }
  if (!configuracao.tiposImagemPermitidos.includes(arquivo.type)) {
    return "Use uma imagem JPG, PNG ou WebP.";
  }
  if (arquivo.size > configuracao.tamanhoMaximoCapaBytes) {
    return "A imagem pode ter no máximo 2 MB.";
  }
  return "";
}

// ---------------------------------------------------------------------------
// Aplica as regras num formulário e mostra as mensagens nos campos (padrão do Bootstrap).
// regras = { idDoCampo: (valor, elemento) => "mensagem de erro" | "" }
export function validarCampos(formulario, regras) {
  let primeiroInvalido = null;
  for (const [id, regra] of Object.entries(regras)) {
    const campo = formulario.querySelector(`#${id}`);
    if (!campo) {
      continue;
    }
    const valor = campo.type === "checkbox" ? campo.checked : campo.type === "file" ? campo.files[0] : campo.value;
    const mensagem = regra(valor, campo);
    marcarCampo(campo, mensagem);
    if (mensagem && !primeiroInvalido) {
      primeiroInvalido = campo;
    }
  }
  primeiroInvalido?.focus();
  return !primeiroInvalido;
}

export function marcarCampo(campo, mensagem) {
  campo.classList.toggle("is-invalid", Boolean(mensagem));
  campo.setAttribute("aria-invalid", mensagem ? "true" : "false");
  const feedback = campo.parentElement.querySelector(".invalid-feedback");
  if (feedback && mensagem) {
    feedback.textContent = mensagem;
  }
}

// Revalida cada campo ao sair dele e enquanto o usuário corrige um erro.
export function ativarValidacaoAoVivo(formulario, regras) {
  for (const [id, regra] of Object.entries(regras)) {
    const campo = formulario.querySelector(`#${id}`);
    if (!campo) {
      continue;
    }
    const revalidar = () => {
      const valor = campo.type === "checkbox" ? campo.checked : campo.type === "file" ? campo.files[0] : campo.value;
      marcarCampo(campo, regra(valor, campo));
    };
    campo.addEventListener("blur", () => campo.value !== "" && revalidar());
    campo.addEventListener(campo.type === "checkbox" || campo.tagName === "SELECT" ? "change" : "input", () => {
      if (campo.classList.contains("is-invalid")) {
        revalidar();
      }
    });
  }
}
