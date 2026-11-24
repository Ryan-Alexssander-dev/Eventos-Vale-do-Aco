# Guia do front-end

O front-end está **completo**: telas, validações, cookies, fluxo de inscrição e consumo da API.
Este guia explica como ele está organizado e como ligá-lo à API real quando ela existir.

## 1. Como rodar

```bash
npm install
cp .env.example .env     # preencha o .env (SMTP é opcional para ver as telas)
npm run dev              # http://127.0.0.1:3000
npm test                 # testes das rotas de e-mail
```

Por padrão o front usa **dados simulados** (guardados no navegador), então tudo funciona sem a API:

| Conta de teste | E-mail | Senha |
|---|---|---|
| Administrador | `admin@exemplo.com` | `Admin@123` |
| Participante | `maria@exemplo.com` | `Senha@123` |

> Essas contas existem **só no modo simulado**. Ele precisa estar desligado em produção (seção 3).

Sem SMTP configurado, em desenvolvimento, o **código de verificação aparece no console do servidor**
(`npm run dev`) em vez de ser enviado por e-mail.

## 2. Organização (`app/static/js/`)

Nomes em pt-BR e camelCase. Cada arquivo faz uma coisa:

| Arquivo | Para que serve |
|---|---|
| `configuracao.js` | **Único** lugar para ajustar: caminhos da API, modo simulado, cidades, categorias |
| `api.js` | `requisitar(caminho, opcoes)`: fetch genérico (recebe o caminho como argumento) |
| `servicoUsuarios.js` | CRUD de usuários, login, senha, eventos salvos |
| `servicoEventos.js` | CRUD de eventos e inscrições |
| `servicoEmail.js` | Código de verificação e e-mail de inscrição (rotas deste projeto) |
| `normalizadores.js` | Converte o formato da API para o do front (aceita `nomeEvento`/`titulo` etc.) |
| `simulacao/dadosSimulados.js` | Implementa os serviços no navegador (modo simulado) |
| `sessao.js` | Usuário logado, redirecionamentos, `proximo` seguro |
| `validacoes.js`, `mascaras.js` | Regras de validação e máscaras (telefone, CNPJ) |
| `cookies.js`, `consentimento.js`, `preferencias.js` | Cookies e consentimento (LGPD) |
| `avatares.js` | Catálogo dos 12 avatares de animais |
| `elementos.js`, `formatacao.js`, `interface.js` | Criação segura de elementos, datas/valores, alertas, avisos |
| `componentes.js`, `modalEvento.js`, `estadoSalvos.js`, `fluxoInscricao.js` | Cartões, janela de detalhes, salvos, inscrição |
| `paginas/*.js` | Um arquivo por tela (carregado como módulo ES: `type="module"`) |

Classes CSS próprias e ids do HTML também estão em pt-BR (`cartao-evento`, `gradeEventos`...).
O que vem do Bootstrap, do navegador (`addEventListener`, `classList`) e do JavaScript continua em inglês.

## 3. Ligando a API real

1. Em `configuracao.js`: `usarDadosSimulados: false`.
2. Ajuste `caminhos` (e `metodoAtualizacao`, `baseApi`) conforme as rotas da equipe.
3. Se os campos da API tiverem outros nomes, ajuste **somente** `normalizadores.js`
   (`normalizarEvento`, `normalizarUsuario`, `eventoParaApi`).
4. Se o login devolver um `token`, o front o guarda e envia em `Authorization: Bearer ...` automaticamente.

O formato esperado de cada rota está em [`CONTRATO-DA-API.md`](CONTRATO-DA-API.md). As rotas de e-mail
(`/api/email/*`) já existem neste projeto e não dependem da API da equipe.

## 4. Fluxos

- **Cadastro:** valida → cria usuário (`emailVerificado: false`) → envia código → `/verificar-email` →
  código correto → marca o e-mail como verificado → `/login`. Quem tenta entrar sem verificar volta para a verificação.
- **Recuperar senha:** e-mail → código → nova senha (a API recebe o `tokenVerificacao`).
- **Login:** administrador → `/admin`; participante → `/home` (ou a tela que ele tentou abrir, via `?proximo=`).
- **Inscrição:** botão "Inscrever-se" na janela de detalhes. Evento **gratuito**: registra e envia o e-mail na hora,
  sem passar pelo pagamento. Evento **pago**: `/pagamento` → ao pagar, registra e envia o e-mail → `/inscricao-confirmada`.
- **Pagamento:** os campos do cartão não têm `name`, não são lidos, validados, guardados nem enviados.
- **Administrador:** `/admin` lista os eventos e tem "Publicar evento" (também editar e excluir). Quem não é administrador
  volta para `/home` ao abrir essas telas.
- **Publicado por:** na janela de detalhes aparece "Publicado por um administrador" ou, quando o evento é de um
  organizador, o perfil dele (avatar + nome).

## 5. Cookies

| Cookie | Tipo | Uso | Duração |
|---|---|---|---|
| `vdaConsentimento` | Necessário | Guarda a escolha do banner | 180 dias |
| `vdaPreferencias` | Preferências | Cidade e filtros (vitrine e salvos) | 180 dias |
| `vdaEmail` | Preferências | E-mail do login ("Lembrar-me") | 90 dias |

Sem consentimento, as preferências só existem em memória. Revogar apaga os cookies de preferências.
Não há cookie de sessão: o usuário logado fica no `sessionStorage` (ou `localStorage` com "Lembrar-me").

Melhorias de usabilidade e desempenho já incluídas: lembrar cidade/filtros; lista de eventos em cache por 1 minuto
e filtrada no navegador (sem requisição a cada tecla); carregamento com "esqueleto"; imagens com carregamento
tardio; compressão das respostas e cache de imagens/bibliotecas no servidor; avisos rápidos em vez de recarregar páginas.

## 6. Ativar o cadastro de empresas (depois)

1. Em `cadastrarOrganizador.html`: remover `disabled` do `<fieldset>` e do botão e o aviso de indisponibilidade.
2. Em `cadastro.html`: trocar o cartão `desativado` por um link para `/cadastro/organizador`; em `index.html`, habilitar o botão.
3. Em `paginas/cadastroOrganizador.js`: implementar o envio (as funções `validarCnpj` etc. já existem).
4. Em `interface.js`/`sessao.js`: definir para onde o organizador vai ao logar (hoje: `/home`).

## 7. Como estender

- **Nova tela:** crie o HTML em `app/templates`, a rota em `app/routers/paginasRoutes.js` e um módulo em `paginas/`.
  Comece o módulo com `iniciarPagina({ exigir: "logado" | "visitante" | "administrador" | null })`.
- **Texto vindo de usuários** entra na tela sempre por `criarElemento(... texto ...)` ou `textContent`, nunca por `innerHTML`.
