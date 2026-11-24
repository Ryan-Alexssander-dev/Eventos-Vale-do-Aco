// Verificação do e-mail por código de 6 dígitos (cadastro e recuperação de senha).

import { definirCarregando, esconderAlerta, iniciarPagina, mostrarAlerta } from "../interface.js";
import { mascararEmail } from "../formatacao.js";
import { enviarCodigoVerificacao, verificarCodigo } from "../servicoEmail.js";
import { buscarUsuarioPorEmail, confirmarEmail } from "../servicoUsuarios.js";
import { limparVerificacaoPendente, obterVerificacaoPendente, salvarVerificacaoPendente } from "../sessao.js";
import { validarCodigo } from "../validacoes.js";

const INTERVALO_REENVIO_S = 60;

const { continuar } = iniciarPagina({ exigir: "visitante" });
if (continuar) iniciar();

function iniciar() {
  const pendente = obterVerificacaoPendente();
  if (!pendente?.email) {
    window.location.replace("/login");
    return;
  }

  const formulario = document.getElementById("formularioCodigo");
  const caixas = [...document.querySelectorAll("#caixasCodigo .caixa-codigo")];
  const erroCodigo = document.getElementById("erroCodigo");
  const botao = document.getElementById("botaoEnviar");
  const botaoReenviar = document.getElementById("botaoReenviar");
  const textoReenvio = document.getElementById("textoReenvio");
  let temporizador;

  document.getElementById("textoEmailDestino").textContent = mascararEmail(pendente.email);
  if (pendente.erroEnvio) mostrarAlerta("Não conseguimos enviar o e-mail agora. Toque em \"Reenviar código\".", "erro");

  // ---- Caixas do código -----------------------------------------------------------------------
  const lerCodigo = () => caixas.map((caixa) => caixa.value).join("");
  const mostrarErro = (mensagem) => {
    erroCodigo.textContent = mensagem;
    erroCodigo.classList.toggle("d-none", !mensagem);
    caixas.forEach((caixa) => caixa.classList.toggle("is-invalid", Boolean(mensagem)));
  };

  caixas.forEach((caixa, indice) => {
    caixa.addEventListener("input", () => {
      caixa.value = caixa.value.replace(/\D/g, "").slice(-1);
      mostrarErro("");
      if (caixa.value && caixas[indice + 1]) caixas[indice + 1].focus();
    });
    caixa.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !caixa.value && caixas[indice - 1]) caixas[indice - 1].focus();
      if (e.key === "ArrowLeft" && caixas[indice - 1]) caixas[indice - 1].focus();
      if (e.key === "ArrowRight" && caixas[indice + 1]) caixas[indice + 1].focus();
    });
    caixa.addEventListener("paste", (e) => {
      e.preventDefault();
      const digitos = (e.clipboardData.getData("text") ?? "").replace(/\D/g, "").slice(0, caixas.length);
      [...digitos].forEach((digito, i) => (caixas[i].value = digito));
      caixas[Math.min(digitos.length, caixas.length - 1)].focus();
      mostrarErro("");
    });
    caixa.addEventListener("focus", () => caixa.select());
  });
  caixas[0].focus();

  // ---- Reenvio com contagem regressiva ---------------------------------------------------------
  function iniciarContagem(segundos) {
    clearInterval(temporizador);
    let restante = segundos;
    const atualizar = () => {
      botaoReenviar.disabled = restante > 0;
      textoReenvio.textContent = restante > 0 ? `Você poderá reenviar em ${restante}s` : "Não recebeu o e-mail?";
    };
    atualizar();
    if (restante <= 0) return;
    temporizador = setInterval(() => {
      restante -= 1;
      atualizar();
      if (restante <= 0) clearInterval(temporizador);
    }, 1000);
  }
  const jaPassou = Math.floor((Date.now() - (pendente.enviadoEm ?? 0)) / 1000);
  iniciarContagem(Math.max(INTERVALO_REENVIO_S - jaPassou, 0));

  botaoReenviar.addEventListener("click", async () => {
    esconderAlerta();
    botaoReenviar.disabled = true;
    try {
      await enviarCodigoVerificacao({ email: pendente.email, finalidade: pendente.finalidade });
      salvarVerificacaoPendente({ ...pendente, enviadoEm: Date.now(), erroEnvio: false });
      caixas.forEach((caixa) => (caixa.value = ""));
      caixas[0].focus();
      mostrarAlerta("Enviamos um novo código para o seu e-mail.", "sucesso");
      iniciarContagem(INTERVALO_REENVIO_S);
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
      iniciarContagem(erro.dados?.esperarSegundos ?? 15);
    }
  });

  // ---- Envio do código ------------------------------------------------------------------------
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAlerta();
    const codigo = lerCodigo();
    const mensagem = validarCodigo(codigo);
    if (mensagem) {
      mostrarErro(mensagem);
      caixas[Math.min(codigo.length, caixas.length - 1)].focus();
      return;
    }

    definirCarregando(botao, true, "Verificando...");
    try {
      const { tokenVerificacao } = await verificarCodigo({ email: pendente.email, finalidade: pendente.finalidade, codigo });

      if (pendente.finalidade === "recuperacao") {
        salvarVerificacaoPendente({ ...pendente, tokenVerificacao, verificado: true });
        window.location.href = "/recuperar-senha?etapa=nova";
        return;
      }

      const idUsuario = pendente.idUsuario ?? (await buscarUsuarioPorEmail(pendente.email))?.id;
      await confirmarEmail(idUsuario, tokenVerificacao);
      limparVerificacaoPendente();
      window.location.href = "/login?verificado=1";
    } catch (erro) {
      mostrarErro(erro.message);
      definirCarregando(botao, false);
    }
  });
}
