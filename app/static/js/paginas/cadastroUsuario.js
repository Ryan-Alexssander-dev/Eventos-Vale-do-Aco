// Cadastro de participante: valida e cria a conta.

import { avatarAleatorio, montarSeletorAvatares, obterAvatarSelecionado, urlAvatar } from "../avatares.js";
import { definirCarregando, esconderAlerta, iniciarPagina, mostrarAlerta } from "../interface.js";
import { criarUsuario } from "../servicoUsuarios.js";
import {
  ativarValidacaoAoVivo, validarAceite, validarCampos, validarConfirmacao,
  validarEmail, validarNome, validarSenhaNova,
} from "../validacoes.js";

const { continuar } = iniciarPagina({ exigir: "visitante" });
if (continuar) {
  iniciar();
}

function iniciar() {
  const formulario = document.getElementById("formularioCadastroUsuario");
  const botao = document.getElementById("botaoEnviar");
  const seletor = document.getElementById("seletorAvatares");
  const previa = document.getElementById("previaAvatar");

  const inicial = avatarAleatorio();
  previa.src = urlAvatar(inicial);
  montarSeletorAvatares(seletor, inicial, (id) => (previa.src = urlAvatar(id)));
  const regras = {
    campoNome: validarNome,
    campoEmail: validarEmail,
    campoSenha: validarSenhaNova,
    campoConfirmarSenha: (valor) => validarConfirmacao(valor, formulario.campoSenha.value),
    campoTermos: validarAceite,
  };
  ativarValidacaoAoVivo(formulario, regras);
  formulario.campoSenha.addEventListener("input", () => {
    if (formulario.campoConfirmarSenha.value) {
      formulario.campoConfirmarSenha.dispatchEvent(new Event("input"));
    }
  });

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAlerta();
    if (!validarCampos(formulario, regras)) {
      return;
    }

    const dados = {
      nome: formulario.campoNome.value.trim().replace(/\s+/g, " "),
      email: formulario.campoEmail.value.trim().toLowerCase(),
      senha: formulario.campoSenha.value,
      avatar: obterAvatarSelecionado(seletor) || inicial,
      tipo: "usuario",
    };

    definirCarregando(botao, true, "Criando conta...");
    try {
      await criarUsuario(dados);
      window.location.href = "/login?cadastro=1";
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
      definirCarregando(botao, false);
    }
  });
}
