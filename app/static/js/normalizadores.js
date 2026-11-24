// Converte o que a API devolve para o formato usado pelo front-end (e vice-versa).
// Aceita os nomes das colunas do banco (nomeEvento, dataEvento...) e os nomes do front (titulo, data...).
// AJUSTAR aqui quando o formato real da API for conhecido.

import { configuracao } from "./configuracao.js";

const { tiposUsuario } = configuracao;

export function normalizarPublicador(bruto) {
  const tipo = bruto?.tipo ?? tiposUsuario.administrador;
  return {
    tipo: tipo === tiposUsuario.organizador ? tiposUsuario.organizador : tiposUsuario.administrador,
    nome: bruto?.nome ?? bruto?.nomeEmpresa ?? "",
    avatar: bruto?.avatar ?? bruto?.logo ?? "",
  };
}

export function normalizarEvento(bruto) {
  if (!bruto) {
    return null;
  }
  const preco = Number(bruto.preco ?? bruto.precoIngresso ?? 0) || 0;
  const hora = String(bruto.hora ?? bruto.horaEvento ?? "").match(/\d{2}:\d{2}/)?.[0] ?? "";
  return {
    id: String(bruto.id ?? bruto.id_event ?? bruto.idEvento ?? ""),
    titulo: bruto.titulo ?? bruto.nomeEvento ?? "",
    descricao: bruto.descricao ?? "",
    data: String(bruto.data ?? bruto.dataEvento ?? "").slice(0, 10),
    hora,
    cidade: bruto.cidade ?? "",
    local: bruto.local ?? bruto.endereco ?? "",
    categoria: bruto.categoria ?? "",
    preco,
    gratuito: preco === 0,
    vagas: bruto.vagas ?? bruto.qtdIngresso ?? null,
    capa: bruto.capa ?? "",
    link: bruto.link ?? "",
    publicador: normalizarPublicador(bruto.publicador ?? bruto.publicadoPor ?? { tipo: bruto.tipoPublicador }),
  };
}

export function normalizarUsuario(bruto) {
  if (!bruto) {
    return null;
  }
  return {
    id: String(bruto.id ?? bruto.id_user ?? bruto.idUsuario ?? ""),
    nome: bruto.nome ?? "",
    email: bruto.email ?? "",
    telefone: bruto.telefone ?? "",
    avatar: bruto.avatar ?? bruto.foto ?? "",
    tipo: bruto.tipo ?? tiposUsuario.comum,
    emailVerificado: bruto.emailVerificado ?? bruto.email_verificado ?? true,
    notificacoes: bruto.notificacoes ?? { lembrete: true, novosEventos: false, avisos: true },
    cidadesInteresse: bruto.cidadesInteresse ?? [],
  };
}

// Corpo enviado à API ao criar/atualizar evento. AJUSTAR os nomes dos campos se a API pedir outros.
export function eventoParaApi(dados) {
  const { capa, ...resto } = dados;
  const corpo = { ...resto };
  if (!(capa instanceof File)) {
    return corpo;
  }
  const formulario = new FormData();
  for (const [campo, valor] of Object.entries(corpo)) {
    if (valor !== undefined && valor !== null) {
      formulario.append(campo, valor);
    }
  }
  formulario.append("capa", capa);
  return formulario;
}
