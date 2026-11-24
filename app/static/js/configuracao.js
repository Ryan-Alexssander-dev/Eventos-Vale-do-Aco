// Configuração do front-end. É o ÚNICO lugar para ajustar quando as rotas do back-end ficarem prontas.
// Itens marcados com "AJUSTAR" são suposições genéricas.

export const configuracao = {
  // Use dados persistidos pela API; o modo simulado é apenas para demonstrações locais.
  // Com true, usuários, eventos, eventos salvos e inscrições ficam no navegador (localStorage).
  // As rotas de e-mail (/api/email) são sempre reais.
  usarDadosSimulados: false,

  // AJUSTAR: endereço base da API. "" = mesmo servidor do site.
  baseApi: "",

  // AJUSTAR: caminhos da API. ":nome" é substituído pelo valor correspondente.
  caminhos: {
    usuarios: "/api/usuarios",
    autenticacao: "/api/usuarios/login",
    eventos: "/api/eventos",
    eventosSalvos: "/api/usuarios/:idUsuario/eventos-salvos",
    inscricoes: "/api/eventos/:idEvento/inscricoes",
    // Rotas de e-mail deste projeto (app/routers/emailRoutes.js) — não dependem da API da equipe.
    email: "/api/email",
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
    verificacaoPendente: "vdaVerificacaoPendente",
    cacheEventos: "vdaCacheEventos",
  },

  cacheEventosMs: 60 * 1000,
  tamanhoMaximoCapaBytes: 2 * 1024 * 1024,
  tiposImagemPermitidos: ["image/jpeg", "image/png", "image/webp"],
};

export function montarCaminho(modelo, parametros = {}) {
  return modelo.replace(/:([A-Za-z]+)/g, (_, nome) => encodeURIComponent(parametros[nome] ?? ""));
}
