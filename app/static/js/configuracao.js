// Configuração do front-end.
// Itens marcados com "AJUSTAR" são suposições genéricas.

export const configuracao = {
  // AJUSTAR: endereço base da API. "" = mesmo servidor do site.
  baseApi: "",

  // AJUSTAR: caminhos da API. ":nome" é substituído pelo valor correspondente.
  caminhos: {
    usuarios: "/api/usuarios",
    autenticacao: "/api/usuarios/login",
    eventos: "/api/eventos",
    eventosSalvos: "/api/usuarios/:idUsuario/eventos-salvos",
    inscricoes: "/api/eventos/:idEvento/inscricoes",
  },

  // AJUSTAR: método HTTP usado para atualizar registros ("PATCH" ou "PUT").
  metodoAtualizacao: "PATCH",

  tempoLimiteRequisicaoMs: 15000,

  cidades: ["Coronel Fabriciano", "Ipatinga", "Timóteo"],

  categorias: [
    { valor: "musica", nome: "Música e shows" },
    { valor: "esportes", nome: "Esportes" },
    { valor: "gastronomia", nome: "Gastronomia" },
    { valor: "teatro", nome: "Teatro e cultura" },
    { valor: "feiras", nome: "Feiras e negócios" },
    { valor: "comunidade", nome: "Comunidade" },
  ],

  tiposUsuario: {
    comum: "usuario",
    organizador: "organizador",
    administrador: "administrador",
  },

  chaves: {
    usuario: "vdaUsuario",
    token: "vdaToken",
    cacheEventos: "vdaCacheEventos",
  },

  cacheEventosMs: 60 * 1000,
  tamanhoMaximoCapaBytes: 2 * 1024 * 1024,
  tiposImagemPermitidos: ["image/jpeg", "image/png", "image/webp"],
};

export function montarCaminho(modelo, parametros = {}) {
  return modelo.replace(/:([A-Za-z]+)/g, (_, nome) => encodeURIComponent(parametros[nome] ?? ""));
}
