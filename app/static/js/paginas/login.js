// Tela de login.

import { definirCarregando, esconderAlerta, iniciarPagina, mostrarAlerta } from "../interface.js";
import { esquecerEmail, lembrarEmail, obterEmailLembrado } from "../preferencias.js";
import { enviarCodigoVerificacao } from "../servicoEmail.js";
import { autenticar } from "../servicoUsuarios.js";
import { ehAdministrador, rotaInicialPorTipo, salvarSessao, salvarVerificacaoPendente, sanitizarProximo } from "../sessao.js";
import { ativarValidacaoAoVivo, validarCampos, validarEmail, validarSenhaPreenchida } from "../validacoes.js";

const { continuar } = iniciarPagina({ exigir: "visitante" });
if (continuar) iniciar();

function iniciar() {
  const formulario = document.getElementById("formularioLogin");
  const botao = document.getElementById("botaoEnviar");
  const consulta = new URLSearchParams(window.location.search);
  const regras = {
    campoEmail: validarEmail,
    campoSenha: validarSenhaPreenchida,
  };
  ativarValidacaoAoVivo(formulario, regras);

  const emailLembrado = obterEmailLembrado();
  if (emailLembrado) {
    formulario.campoEmail.value = emailLembrado;
    formulario.campoLembrar.checked = true;
  }
  if (consulta.get("verificado")) mostrarAlerta("E-mail confirmado! Agora é só entrar com a sua conta.", "sucesso");
  if (consulta.get("senhaAlterada")) mostrarAlerta("Senha alterada com sucesso. Entre com a nova senha.", "sucesso");

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAlerta();
    if (!validarCampos(formulario, regras)) return;

    const email = formulario.campoEmail.value.trim();
    definirCarregando(botao, true, "Entrando...");
    try {
      const { usuario, token } = await autenticar({ email, senha: formulario.campoSenha.value });

      if (usuario.emailVerificado === false) {
        // Conta criada, mas o e-mail ainda não foi confirmado: manda um código novo.
        const pendente = { email: usuario.email, finalidade: "cadastro", idUsuario: usuario.id, enviadoEm: Date.now() };
        await enviarCodigoVerificacao({ email: usuario.email, nome: usuario.nome, finalidade: "cadastro" }).catch(() => {
          pendente.erroEnvio = true;
        });
        salvarVerificacaoPendente(pendente);
        window.location.href = "/verificar-email";
        return;
      }

      salvarSessao({ usuario, token }, formulario.campoLembrar.checked);
      if (formulario.campoLembrar.checked) lembrarEmail(email);
      else esquecerEmail();

      const proximo = sanitizarProximo(consulta.get("proximo"));
      window.location.href = ehAdministrador(usuario) ? rotaInicialPorTipo(usuario.tipo) : (proximo ?? rotaInicialPorTipo(usuario.tipo));
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
      definirCarregando(botao, false);
    }
  });
}
