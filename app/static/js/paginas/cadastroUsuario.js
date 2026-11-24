// Cadastro de participante: valida, cria a conta e envia o código de verificação por e-mail.

import { avatarAleatorio, montarSeletorAvatares, obterAvatarSelecionado, urlAvatar } from "../avatares.js";
import { definirCarregando, esconderAlerta, iniciarPagina, mostrarAlerta } from "../interface.js";
import { aplicarMascara, formatarTelefone } from "../mascaras.js";
import { enviarCodigoVerificacao } from "../servicoEmail.js";
import { criarUsuario } from "../servicoUsuarios.js";
import { salvarVerificacaoPendente } from "../sessao.js";
import {
  ativarValidacaoAoVivo, somenteDigitos, validarAceite, validarCampos, validarConfirmacao,
  validarEmail, validarNome, validarSenhaNova, validarTelefone,
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
  aplicarMascara(formulario.campoTelefone, formatarTelefone);

  const regras = {
    campoNome: validarNome,
    campoEmail: validarEmail,
    campoTelefone: validarTelefone,
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
      telefone: somenteDigitos(formulario.campoTelefone.value),
      senha: formulario.campoSenha.value,
      avatar: obterAvatarSelecionado(seletor) || inicial,
      tipo: "usuario",
      emailVerificado: false,
    };

    definirCarregando(botao, true, "Criando conta...");
    try {
      const usuario = await criarUsuario(dados);
      const pendente = { email: dados.email, finalidade: "cadastro", idUsuario: usuario?.id, enviadoEm: Date.now() };
      await enviarCodigoVerificacao({ email: dados.email, nome: dados.nome, finalidade: "cadastro" }).catch(() => {
        pendente.erroEnvio = true;
      });
      salvarVerificacaoPendente(pendente);
      window.location.href = "/verificar-email";
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
      definirCarregando(botao, false);
    }
  });
}
