// Configurações: cidades de interesse, cookies e download dos dados.

import { definirCarregando, iniciarPagina, mostrarAlerta } from "../interface.js";
import { listarEventosSalvos, atualizarUsuario, buscarUsuario } from "../servicoUsuarios.js";

const { continuar, usuario: usuarioSessao } = iniciarPagina({ exigir: "logado" });
if (continuar) {
  iniciar(usuarioSessao);
}

async function iniciar(usuarioSessao) {
  let usuario = usuarioSessao;
  try {
    usuario = await buscarUsuario(usuarioSessao.id);
  } catch {
    /* usa os dados da sessão */
  }

  const formulario = document.getElementById("formularioConfiguracoes");
  const cidades = usuario.cidadesInteresse ?? [];
  formulario.querySelectorAll("input[name=cidadesInteresse]").forEach((caixa) => (caixa.checked = cidades.includes(caixa.value)));

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const botao = document.getElementById("botaoEnviar");
    definirCarregando(botao, true, "Salvando...");
    try {
      await atualizarUsuario(usuario.id, {
        cidadesInteresse: [...formulario.querySelectorAll("input[name=cidadesInteresse]:checked")].map((caixa) => caixa.value),
      });
      mostrarAlerta("Configurações salvas.", "sucesso");
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
    } finally {
      definirCarregando(botao, false);
    }
  });

  // Baixa os dados da conta (direito do titular na LGPD), montados no navegador.
  document.getElementById("botaoBaixarDados").addEventListener("click", async () => {
    try {
      const eventosSalvos = await listarEventosSalvos(usuario.id).catch(() => []);
      const conteudo = JSON.stringify(
        { geradoEm: new Date().toISOString(), conta: { nome: usuario.nome, email: usuario.email, avatar: usuario.avatar }, eventosSalvos: eventosSalvos.map((e) => ({ id: e.id, titulo: e.titulo, data: e.data })) },
        null,
        2
      );
      const endereco = URL.createObjectURL(new Blob([conteudo], { type: "application/json" }));
      const link = Object.assign(document.createElement("a"), { href: endereco, download: "meus-dados-eventos-vale-do-aco.json" });
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(endereco);
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
    }
  });
}
