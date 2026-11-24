// Recuperação de senha em duas etapas: 1) e-mail (e código)  2) nova senha (depois de verificar o código).

import { definirCarregando, esconderAlerta, iniciarPagina, mostrarAlerta } from "../interface.js";
import { enviarCodigoVerificacao } from "../servicoEmail.js";
import { buscarUsuarioPorEmail, redefinirSenha } from "../servicoUsuarios.js";
import { limparVerificacaoPendente, obterVerificacaoPendente, salvarVerificacaoPendente } from "../sessao.js";
import { ativarValidacaoAoVivo, validarCampos, validarConfirmacao, validarEmail, validarSenhaNova } from "../validacoes.js";

const { continuar } = iniciarPagina({ exigir: "visitante" });
if (continuar) {
  iniciar();
}

function iniciar() {
  const etapaNova = new URLSearchParams(window.location.search).get("etapa") === "nova";
  const pendente = obterVerificacaoPendente();

  if (etapaNova && pendente?.verificado && pendente.finalidade === "recuperacao") {
    iniciarNovaSenha(pendente);
  } else {
    iniciarPedidoDeCodigo();
  }
}

function iniciarPedidoDeCodigo() {
  const formulario = document.getElementById("formularioRecuperacao");
  const botao = formulario.querySelector("[data-botao-enviar]");
  const regras = { campoEmail: validarEmail };
  ativarValidacaoAoVivo(formulario, regras);

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAlerta();
    if (!validarCampos(formulario, regras)) {
      return;
    }

    const email = formulario.campoEmail.value.trim().toLowerCase();
    definirCarregando(botao, true, "Enviando...");
    try {
      // A resposta é a mesma exista ou não a conta: não revelamos quem tem cadastro.
      const usuario = await buscarUsuarioPorEmail(email).catch(() => null);
      const pendente = { email, finalidade: "recuperacao", idUsuario: usuario?.id, enviadoEm: Date.now() };
      if (usuario) {
        await enviarCodigoVerificacao({ email, nome: usuario.nome, finalidade: "recuperacao" }).catch(() => {
          pendente.erroEnvio = true;
        });
      }
      salvarVerificacaoPendente(pendente);
      window.location.href = "/verificar-email";
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
      definirCarregando(botao, false);
    }
  });
}

function iniciarNovaSenha(pendente) {
  document.getElementById("etapaEmail").classList.add("d-none");
  document.getElementById("etapaNovaSenha").classList.remove("d-none");

  const formulario = document.getElementById("formularioNovaSenha");
  const botao = formulario.querySelector("[data-botao-enviar]");
  const regras = {
    campoNovaSenha: validarSenhaNova,
    campoConfirmarNovaSenha: (valor) => validarConfirmacao(valor, formulario.campoNovaSenha.value),
  };
  ativarValidacaoAoVivo(formulario, regras);

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAlerta();
    if (!validarCampos(formulario, regras)) {
      return;
    }

    definirCarregando(botao, true, "Salvando...");
    try {
      await redefinirSenha({ email: pendente.email, novaSenha: formulario.campoNovaSenha.value, tokenVerificacao: pendente.tokenVerificacao });
      limparVerificacaoPendente();
      window.location.href = "/login?senhaAlterada=1";
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
      definirCarregando(botao, false);
    }
  });
}
