# Contrato da API (o que o front-end espera)

Para a equipe que implementa o CRUD de **usuários** e **eventos**. Tudo é **ajustável** em
`app/static/js/configuracao.js` (caminhos, método de atualização) e `app/static/js/normalizadores.js`
(nomes dos campos) — o front foi escrito sem conhecer as rotas reais. Os valores abaixo são as suposições atuais.

Convenções: JSON em UTF-8; erros com status HTTP adequado e corpo `{ "mensagem": "texto para o usuário" }`
(o front também lê `erro`); datas como `AAAA-MM-DD` e horas como `HH:MM`; autenticação opcional por
`Authorization: Bearer <token>` (se o login devolver `token`). Listas podem vir puras (`[...]`) ou embrulhadas
(`{ "dados": [...] }`, `{ "eventos": [...] }`).

## Usuários — `/api/usuarios`

| Ação | Requisição | Resposta |
|---|---|---|
| Login | `POST /api/usuarios/login` `{ email, senha }` | `{ usuario, token }`. `401` se errado |
| Sessão atual | `GET /api/usuarios/me` com `Authorization: Bearer <token>` | `{ usuario }` |
| Criar | `POST /api/usuarios` `{ nome, email, senha, avatar, tipo: "usuario" }` | usuário criado. `409` se o e-mail já existe |
| Buscar | `GET /api/usuarios/:id` | usuário |
| Buscar por e-mail | `GET /api/usuarios?email=...` | lista (ou usuário); `404`/lista vazia se não existir |
| Atualizar | `PATCH /api/usuarios/:id` (ou `PUT`) com campos parciais | usuário atualizado |
| Excluir | `DELETE /api/usuarios/:id` `{ senha }` | `204` |

Campos do usuário: `id`, `nome`, `email`, `avatar` (id do animal, ex. `"raposa"`),
`tipo` (`"usuario"` \| `"organizador"` \| `"administrador"`), `emailVerificado` (boolean legado; não bloqueia o login), `notificacoes`
(`{ lembrete, novosEventos, avisos }`), `cidadesInteresse` (lista de cidades).
**Nunca devolver senha ou hash.**

Usos do `PATCH /api/usuarios/:id`:

- **Perfil:** `{ nome }`, `{ avatar }`, `{ notificacoes, cidadesInteresse }`.
- **Trocar senha (logado):** `{ senhaAtual, novaSenha }` — conferir a senha atual; `403` se estiver errada.
- **Trocar senha:** sempre exige `{ senhaAtual, novaSenha }`.

O cadastro não verifica a posse do endereço de e-mail, e o login não depende do campo legado `emailVerificado`.
A recuperação automática de senha está desativada: usuários autenticados podem alterar a senha informando a senha atual.
Contas sem acesso devem ser tratadas manualmente pela equipe responsável.

### Eventos salvos

| Ação | Requisição | Resposta |
|---|---|---|
| Listar | `GET /api/usuarios/:idUsuario/eventos-salvos` | lista de eventos |
| Salvar | `POST /api/usuarios/:idUsuario/eventos-salvos` `{ idEvento }` | `201`/`204` |
| Remover | `DELETE /api/usuarios/:idUsuario/eventos-salvos/:idEvento` | `204` |

## Eventos — `/api/eventos`

| Ação | Requisição | Resposta |
|---|---|---|
| Listar | `GET /api/eventos` | todos os eventos (o front filtra no navegador) |
| Buscar | `GET /api/eventos/:id` | evento |
| Criar | `POST /api/eventos` — JSON, ou `multipart/form-data` quando há imagem de capa (campo `capa`) | evento criado — **só administrador** |
| Atualizar | `PATCH /api/eventos/:id` (ou `PUT`) | evento — **só administrador** |
| Excluir | `DELETE /api/eventos/:id` | `204` — **só administrador** |
| Inscrição | `POST /api/eventos/:idEvento/inscricoes` `{ idUsuario }` | `201`/`204` |

Campos do evento (o `normalizarEvento` também aceita os nomes do banco: `nomeEvento`, `dataEvento`, `horaEvento`,
`endereco`, `precoIngresso`, `qtdIngresso`):
`id`, `titulo`, `descricao` (até 255), `data`, `hora`, `cidade` (`Coronel Fabriciano` \| `Ipatinga` \| `Timóteo`),
`local`, `categoria` (`musica`, `esportes`, `gastronomia`, `teatro`, `feiras`, `comunidade`), `preco` (0 = gratuito),
`vagas` (opcional), `link` (opcional, http/https), `capa` (URL da imagem; vazio = capa padrão),
`publicador` (`{ tipo: "administrador" | "organizador", nome, avatar }` — para administrador o nome não é exibido).

Na criação o front também envia `idPublicador` e `tipoPublicador`; **o servidor deve usar o usuário
autenticado**, não confiar nesses campos. Tokens são assinados com `SECRET_KEY`, expiram em quatro
horas e o perfil é relido do banco em cada operação protegida.

As imagens enviadas no campo `capa` aceitam PNG, JPEG ou WebP, com assinatura validada e limite de
2 MB. O servidor envia o arquivo ao bucket público `event-covers` no Supabase Storage e grava a URL
pública retornada na coluna `eventos.capa`. Ao substituir ou excluir um evento, a imagem anterior
do bucket também é removida.

## O que a API precisa garantir (o front não protege nada sozinho)

- **Permissões:** criar/editar/excluir evento só para `administrador`; usuário só altera os **próprios** dados
  e eventos salvos (use o id do usuário autenticado, não o da URL/corpo).
- **Senhas** com bcrypt/argon2; nunca em texto puro nem nas respostas. Repetir as validações de `validacoes.js`
  (nome, e-mail, senha ≥ 8 com letras e números, tamanhos máximos, cidade/categoria da lista, preço ≥ 0, link http/https).
- **Login** sem revelar se o e-mail existe; limite de tentativas. O endereço cadastrado não é verificado.
- **Upload de capa:** validar tipo real do arquivo, limite de 2 MB, nome gerado pelo servidor, sem SVG.
- **Datas:** cuidado com fuso horário ao serializar `DATE` do MySQL (devolver `AAAA-MM-DD` como texto).

O perfil de administrador não pode ser definido pelo cadastro público. Crie a primeira conta com
`npm run criar:admin`; as variáveis `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` são usadas apenas
por esse comando. Rode `npm run migrate-db` para atualizar um banco já existente sem apagar registros.

## Banco de dados

`VDA-Eventos.sql` cria o esquema completo: usuários e suas preferências, empresas, eventos (incluindo URLs de capas),
eventos salvos e inscrições, com chaves estrangeiras e índices. Para atualizar um banco existente sem apagar
registros, rode `npm run migrate-db`; a migração interrompe a conversão de `qtdIngresso` se encontrar valores
que não sejam capacidades inteiras válidas.

Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no servidor, e crie no projeto Supabase o bucket público
`event-covers` (ou configure o nome em `SUPABASE_BUCKET_EVENTOS`). A chave de serviço nunca deve ser enviada
ao navegador. O projeto/bucket também precisa permitir imagens PNG, JPEG e WebP de até 2 MB.

A tabela `eventos` associa o publicador pelo `id_user` e, quando aplicável, a empresa pelo `id_company`.
Como não há cadastro de empresas na primeira entrega, todo evento terá `publicador.tipo = "administrador"`.
