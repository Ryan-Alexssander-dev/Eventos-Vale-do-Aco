# Eventos Vale do Aço

Central de eventos de **Coronel Fabriciano, Ipatinga e Timóteo**. Administradores publicam os eventos;
participantes se cadastram (com e-mail verificado por código), **salvam** eventos na agenda e **se inscrevem**
— eventos gratuitos na hora, eventos pagos por uma tela de pagamento. O cadastro de empresas aparece na interface,
mas está desativado na primeira entrega.

> Projeto Integrador Senac. O front-end usa a API do projeto para contas e eventos; capas são armazenadas no Supabase
> e os dados principais no MySQL. As rotas de e-mail usam SMTP.

## Tecnologias

- **Front-end:** HTML5, CSS3, JavaScript (módulos ES), [Bootstrap 5](https://getbootstrap.com/) e Bootstrap Icons
- **Back-end:** Node.js + [Express](https://expressjs.com/), e-mails com [Nodemailer](https://nodemailer.com/)
- **Banco de dados:** MySQL (`VDA-Eventos.sql`)

## Como rodar

```bash
npm install
cp .env.example .env      # preencha o .env (veja os comentários dentro dele)
npm run migrate-db        # cria/atualiza as tabelas sem apagar contas ou eventos existentes
npm run criar:admin       # cria a primeira conta administrativa
npm run dev               # http://127.0.0.1:3000
npm test                  # testes automatizados
```

Requer Node.js 24.x. Consulte [`docs/GUIA-DO-FRONT-END.md`](docs/GUIA-DO-FRONT-END.md) para a organização do front-end.

Para criar o primeiro administrador, preencha `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env`.
A senha deve ter ao menos 12 caracteres. Execute `npm run criar:admin` uma única vez e depois remova
`ADMIN_PASSWORD` do `.env`. O cadastro público não permite escolher o perfil de administrador. Entre
pela tela `/login`; o token dura 4 horas e as rotas de publicação validam a permissão no servidor.

Importe `VDA-Eventos.sql` no MySQL antes de executar a migração. Para uma instalação existente,
`npm run migrate-db` adiciona as colunas necessárias e preserva os registros. Configure também
`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` e `SECRET_KEY` no `.env`.

## Estrutura

```
EventosVDA/
├── app/
│   ├── main.js             # servidor Express (segurança, estáticos, rotas)
│   ├── config.js           # lê o .env (único arquivo que faz isso)
│   ├── database.js         # pool de conexões MySQL
│   ├── routers/            # páginas, e-mail (pronto) e CRUD de usuários/eventos (equipe de back-end)
│   ├── services/           # e-mail, códigos de verificação e armazenamento de capas
│   ├── schemas/            # validação de e-mail
│   ├── middlewares/        # limite de requisições
│   ├── templates/          # telas HTML (Bootstrap)
│   └── static/             # css/, js/ (módulos) e img/ (inclui os avatares de animais)
├── tests/                  # testes automatizados (node:test)
├── docs/                   # guias
├── VDA-Eventos.sql         # criação do banco
├── .env.example            # modelo de variáveis de ambiente (sem valores reais)
└── package.json
```

## Telas

| Rota | Arquivo | Quem acessa |
|---|---|---|
| `/` | `index.html` | Visitante |
| `/login` | `login.html` | Visitante |
| `/cadastro` | `cadastro.html` | Visitante — escolha do tipo de conta (empresa: em breve) |
| `/cadastro/usuario` | `cadastrarUsuario.html` | Visitante |
| `/cadastro/organizador` | `cadastrarOrganizador.html` | Visitante — **desativado** |
| `/verificar-email` | `verificarEmail.html` | Código de 6 dígitos enviado por e-mail |
| `/recuperar-senha` | `recuperarSenha.html` | Visitante |
| `/home` | `home.html` | Logado |
| `/eventos-salvos` | `eventosSalvos.html` | Participante |
| `/perfil`, `/configuracoes` | `perfil.html`, `configuracoes.html` | Logado |
| `/pagamento`, `/inscricao-confirmada` | `pagamento.html`, `inscricaoConfirmada.html` | Participante |
| `/admin` | `admin.html` | Administrador (publicar, editar e excluir eventos) |
| `/publicar-evento` | `cadastrarEvento.html` | Administrador |
| `/termos`, `/privacidade`, `/cookies` | `termos.html`, `privacidade.html`, `cookies.html` | Todos |

## Documentação

- [`docs/GUIA-DO-FRONT-END.md`](docs/GUIA-DO-FRONT-END.md) — organização, fluxos, cookies e como ligar a API real
- [`docs/CONTRATO-DA-API.md`](docs/CONTRATO-DA-API.md) — o que o front espera das rotas (para a equipe de back-end)
- [`docs/SEGURANCA-E-PUBLICACAO.md`](docs/SEGURANCA-E-PUBLICACAO.md) — checklist antes do GitHub e da produção

## Licença

[MIT](LICENSE)
