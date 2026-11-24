// Publicar / editar evento (somente administradores).

import { definirCarregando, esconderAlerta, iniciarPagina, mostrarAlerta } from "../interface.js";
import { atualizarEvento, buscarEvento, criarEvento } from "../servicoEventos.js";
import {
  ativarValidacaoAoVivo, validarCampos, validarCategoria, validarCidade, validarDataEvento, validarDescricaoEvento,
  validarHoraEvento, validarImagem, validarLinkOpcional, validarLocalEvento, validarPreco, validarTituloEvento, validarVagas,
} from "../validacoes.js";

const { continuar, usuario } = iniciarPagina({ exigir: "administrador" });
if (continuar) {
  iniciar(usuario);
}

async function iniciar(usuario) {
  const formulario = document.getElementById("formularioEvento");
  const botao = document.getElementById("botaoEnviar");
  const previa = document.getElementById("previaCapa");
  const capaOriginal = previa.src;
  const idEdicao = new URLSearchParams(window.location.search).get("id");
  let enderecoPrevia = null;

  const alternarGratuito = () => {
    const gratis = formulario.campoGratuito.checked;
    formulario.campoPreco.disabled = gratis;
    if (gratis) {
      formulario.campoPreco.value = "";
      formulario.campoPreco.classList.remove("is-invalid");
    }
  };
  const atualizarContador = () => {
    document.getElementById("contadorDescricao").textContent = `${formulario.campoDescricao.value.length}/255`;
  };

  const regras = {
    campoTitulo: validarTituloEvento,
    campoCategoria: validarCategoria,
    campoDescricao: validarDescricaoEvento,
    campoData: (valor) => validarDataEvento(valor, { permitirPassado: Boolean(idEdicao) }),
    campoHora: validarHoraEvento,
    campoCidade: validarCidade,
    campoLocal: validarLocalEvento,
    campoPreco: (valor) => validarPreco(valor, formulario.campoGratuito.checked),
    campoVagas: validarVagas,
    campoLink: validarLinkOpcional,
    campoCapa: (arquivo) => validarImagem(arquivo),
  };
  ativarValidacaoAoVivo(formulario, regras);

  formulario.campoGratuito.addEventListener("change", alternarGratuito);
  formulario.campoDescricao.addEventListener("input", atualizarContador);
  formulario.campoCapa.addEventListener("change", () => {
    if (enderecoPrevia) {
      URL.revokeObjectURL(enderecoPrevia);
    }
    const arquivo = formulario.campoCapa.files[0];
    if (arquivo && !validarImagem(arquivo)) {
      enderecoPrevia = URL.createObjectURL(arquivo);
      previa.src = enderecoPrevia;
    } else {
      previa.src = capaOriginal;
    }
  });

  if (idEdicao) {
    document.getElementById("tituloFormularioEvento").textContent = "Editar evento";
    document.getElementById("textoBotaoEnviar").textContent = "Salvar alterações";
    document.title = "Editar evento | Eventos Vale do Aço";
    try {
      const evento = await buscarEvento(idEdicao);
      formulario.campoTitulo.value = evento.titulo;
      formulario.campoCategoria.value = evento.categoria;
      formulario.campoDescricao.value = evento.descricao;
      formulario.campoData.value = evento.data;
      formulario.campoHora.value = evento.hora;
      formulario.campoCidade.value = evento.cidade;
      formulario.campoLocal.value = evento.local;
      formulario.campoGratuito.checked = evento.gratuito;
      formulario.campoPreco.value = evento.gratuito ? "" : evento.preco;
      formulario.campoVagas.value = evento.vagas ?? "";
      formulario.campoLink.value = evento.link;
      if (evento.capa) {
        previa.src = evento.capa;
      }
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
      formulario.querySelector("fieldset").disabled = true;
    }
  }
  alternarGratuito();
  atualizarContador();

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAlerta();
    if (!validarCampos(formulario, regras)) {
      return;
    }

    const gratuito = formulario.campoGratuito.checked;
    const dados = {
      titulo: formulario.campoTitulo.value.trim(),
      categoria: formulario.campoCategoria.value,
      descricao: formulario.campoDescricao.value.trim(),
      data: formulario.campoData.value,
      hora: formulario.campoHora.value,
      cidade: formulario.campoCidade.value,
      local: formulario.campoLocal.value.trim(),
      preco: gratuito ? 0 : Number(String(formulario.campoPreco.value).replace(",", ".")),
      vagas: formulario.campoVagas.value === "" ? undefined : Number(formulario.campoVagas.value),
      link: formulario.campoLink.value.trim() || undefined,
      capa: formulario.campoCapa.files[0],
      idPublicador: usuario.id,
      tipoPublicador: usuario.tipo,
    };

    definirCarregando(botao, true, "Salvando...");
    try {
      if (idEdicao) {
        await atualizarEvento(idEdicao, dados);
      } else {
        await criarEvento(dados);
      }
      window.location.href = `/admin?${idEdicao ? "editado" : "publicado"}=1`;
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
      definirCarregando(botao, false);
    }
  });
}
