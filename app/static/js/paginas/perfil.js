// Perfil do usuário: nome, avatar, telefone, senha e exclusão da conta.

import { montarSeletorAvatares, obterAvatarSelecionado, urlAvatar } from "../avatares.js";
import { definirCarregando, esconderAlerta, iniciarPagina, mostrarAlerta, mostrarAviso } from "../interface.js";
import { aplicarMascara, formatarTelefone } from "../mascaras.js";
import { atualizarSenha, atualizarUsuario, buscarUsuario, excluirUsuario } from "../servicoUsuarios.js";
import { atualizarUsuarioNaSessao, sair } from "../sessao.js";
import {
  ativarValidacaoAoVivo, somenteDigitos, validarCampos, validarConfirmacao, validarNome,
  validarSenhaNova, validarSenhaPreenchida, validarTelefone,
} from "../validacoes.js";

const { continuar, usuario: usuarioSessao } = iniciarPagina({ exigir: "logado" });
if (continuar) iniciar(usuarioSessao);

async function iniciar(usuarioSessao) {
  let usuario = usuarioSessao;
  try {
    usuario = await buscarUsuario(usuarioSessao.id);
  } catch {
    /* usa os dados da sessão */
  }

  const $ = (id) => document.getElementById(id);
  const fotoPerfil = $("fotoPerfil");
  const seletor = $("seletorAvatares");

  function mostrarDados() {
    $("nomeExibido").textContent = usuario.nome;
    $("emailExibido").textContent = usuario.email;
    fotoPerfil.src = urlAvatar(usuario.avatar);
    document.querySelectorAll("[data-usuario-nome]").forEach((el) => (el.textContent = usuario.nome));
    document.querySelectorAll("[data-usuario-avatar]").forEach((el) => (el.src = urlAvatar(usuario.avatar)));
  }

  async function salvar(botao, textoCarregando, parcial, mensagemSucesso) {
    esconderAlerta();
    definirCarregando(botao, true, textoCarregando);
    try {
      const atualizado = await atualizarUsuario(usuario.id, parcial);
      usuario = { ...usuario, ...parcial, ...(atualizado ?? {}) };
      atualizarUsuarioNaSessao({ nome: usuario.nome, avatar: usuario.avatar, telefone: usuario.telefone });
      mostrarDados();
      mostrarAlerta(mensagemSucesso, "sucesso");
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
    } finally {
      definirCarregando(botao, false);
    }
  }

  mostrarDados();

  // ---- Avatar --------------------------------------------------------------------------------
  montarSeletorAvatares(seletor, usuario.avatar, (id) => (fotoPerfil.src = urlAvatar(id)));
  $("formularioAvatar").addEventListener("submit", (e) => {
    e.preventDefault();
    const avatar = obterAvatarSelecionado(seletor);
    if (!avatar) return mostrarAlerta("Escolha um avatar.", "erro");
    salvar($("formularioAvatar").querySelector("button[type=submit]"), "Salvando...", { avatar }, "Avatar atualizado.");
  });

  // ---- Nome ----------------------------------------------------------------------------------
  const formularioPerfil = $("formularioPerfil");
  formularioPerfil.campoNome.value = usuario.nome;
  const regrasPerfil = { campoNome: validarNome };
  ativarValidacaoAoVivo(formularioPerfil, regrasPerfil);
  formularioPerfil.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validarCampos(formularioPerfil, regrasPerfil)) return;
    salvar(formularioPerfil.querySelector("button[type=submit]"), "Salvando...", { nome: formularioPerfil.campoNome.value.trim().replace(/\s+/g, " ") }, "Nome atualizado.");
  });

  // ---- Contato (o e-mail é somente leitura: trocar exige nova verificação) -------------------------
  const formularioContato = $("formularioContato");
  formularioContato.campoEmail.value = usuario.email;
  formularioContato.campoTelefone.value = usuario.telefone;
  aplicarMascara(formularioContato.campoTelefone, formatarTelefone);
  const regrasContato = { campoTelefone: validarTelefone };
  ativarValidacaoAoVivo(formularioContato, regrasContato);
  formularioContato.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validarCampos(formularioContato, regrasContato)) return;
    salvar(formularioContato.querySelector("button[type=submit]"), "Salvando...", { telefone: somenteDigitos(formularioContato.campoTelefone.value) }, "Contato atualizado.");
  });

  // ---- Senha ---------------------------------------------------------------------------------
  const formularioSenha = $("formularioSenha");
  const regrasSenha = {
    campoSenhaAtual: validarSenhaPreenchida,
    campoNovaSenha: (valor, campo) => (valor === formularioSenha.campoSenhaAtual.value ? "A nova senha deve ser diferente da atual." : validarSenhaNova(valor)),
    campoConfirmarNovaSenha: (valor) => validarConfirmacao(valor, formularioSenha.campoNovaSenha.value),
  };
  ativarValidacaoAoVivo(formularioSenha, regrasSenha);
  formularioSenha.addEventListener("submit", async (e) => {
    e.preventDefault();
    esconderAlerta();
    if (!validarCampos(formularioSenha, regrasSenha)) return;
    const botao = formularioSenha.querySelector("button[type=submit]");
    definirCarregando(botao, true, "Alterando...");
    try {
      await atualizarSenha(usuario.id, { senhaAtual: formularioSenha.campoSenhaAtual.value, novaSenha: formularioSenha.campoNovaSenha.value });
      formularioSenha.reset();
      formularioSenha.classList.remove("was-validated");
      mostrarAlerta("Senha alterada com sucesso.", "sucesso");
    } catch (erro) {
      mostrarAlerta(erro.message, "erro");
    } finally {
      definirCarregando(botao, false);
    }
  });

  // ---- Excluir conta -------------------------------------------------------------------------
  const formularioExcluir = $("formularioExcluirConta");
  const regrasExcluir = { campoSenhaExclusao: validarSenhaPreenchida };
  formularioExcluir.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validarCampos(formularioExcluir, regrasExcluir)) return;
    const botao = formularioExcluir.querySelector("button[type=submit]");
    definirCarregando(botao, true, "Excluindo...");
    try {
      await excluirUsuario(usuario.id, formularioExcluir.campoSenhaExclusao.value);
      sair();
    } catch (erro) {
      mostrarAviso(erro.message, "erro");
      definirCarregando(botao, false);
    }
  });
}
