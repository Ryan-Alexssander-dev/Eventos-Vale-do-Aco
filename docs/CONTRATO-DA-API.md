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
| Login | `POST /api/usuarios/login` `{ email, senha }` | `{ usuario, token? }` ou o próprio usuário. `401` se errado |
| Criar | `POST /api/usuarios` `{ nome, email, telefone, senha, avatar, tipo: "usuario", emailVerificado: false }` | usuário criado. `409` se o e-mail já existe |
| Buscar | `GET /api/usuarios/:id` | usuário |
| Buscar por e-mail | `GET /api/usuarios?email=...` | lista (ou usuário); `404`/lista vazia se não existir |
| Atualizar | `PATCH /api/usuarios/:id` (ou `PUT`) com campos parciais | usuário atualizado |
| Excluir | `DELETE /api/usuarios/:id` `{ senha }` | `204` |

Campos do usuário: `id`, `nome`, `email`, `telefone` (só dígitos, 10–11), `avatar` (id do animal, ex. `"raposa"`),
`tipo` (`"usuario"` \| `"organizador"` \| `"administrador"`), `emailVerificado` (boolean), `notificacoes`
(`{ lembrete, novosEventos, avisos }`), `cidadesInteresse` (lista de cidades).
**Nunca devolver senha ou hash.**

Usos do `PATCH /api/usuarios/:id`:

- **Perfil:** `{ nome }`, `{ avatar }`, `{ telefone }`, `{ notificacoes, cidadesInteresse }`.
- **Trocar senha (logado):** `{ senhaAtual, novaSenha }` — conferir a senha atual; `403` se estiver errada.
- **Confirmar e-mail:** `{ emailVerificado: true, tokenVerificacao }`.
- **Recuperar senha:** `{ novaSenha, tokenVerificacao }`.

O `tokenVerificacao` é emitido por `POST /api/email/verificar` (abaixo). **A API deve validá-lo** com
`verificarToken(token)` de `app/services/codigosVerificacao.js`: devolve `{ email, finalidade }` ou `null`.
Confira que o e-mail do token é o do usuário e que a `finalidade` é `"cadastro"` (confirmar e-mail) ou
`"recuperacao"` (nova senha). Sem isso, qualquer pessoa poderia marcar e-mails como verificados ou trocar senhas.

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
autenticado**, não confiar nesses campos.

## Rotas de e-mail (já implementadas neste projeto) — `/api/email`

| Rota | Corpo | Resposta |
|---|---|---|
| `POST /codigo` | `{ email, finalidade: "cadastro" \| "recuperacao", nome? }` | `{ ok: true }`. `429` (com `esperarSegundos`) se pedir de novo em menos de 60 s ou mais de 5 vezes por hora |
| `POST /verificar` | `{ email, finalidade, codigo }` | `{ ok: true, tokenVerificacao }`; `400` se o código estiver errado ou expirado |
| `POST /inscricao` | `{ email, nome, evento: { titulo, data, hora, local, cidade, preco } }` | `{ ok: true }` |

Código de 6 dígitos, validade de 10 minutos, 5 tentativas, uso único; só o hash fica em memória (veja os limites no
topo de `app/services/codigosVerificacao.js`). O envio usa o SMTP do Google configurado no `.env`.

## O que a API precisa garantir (o front não protege nada sozinho)

- **Permissões:** criar/editar/excluir evento só para `administrador`; usuário só altera os **próprios** dados
  e eventos salvos (use o id do usuário autenticado, não o da URL/corpo).
- **Senhas** com bcrypt/argon2; nunca em texto puro nem nas respostas. Repetir as validações de `validacoes.js`
  (nome, e-mail, telefone, senha ≥ 8 com letras e números, tamanhos máximos, cidade/categoria da lista, preço ≥ 0, link http/https).
- **Login** sem revelar se o e-mail existe; limite de tentativas; devolver `emailVerificado`.
- **Upload de capa:** validar tipo real do arquivo, limite de 2 MB, nome gerado pelo servidor, sem SVG.
- **Datas:** cuidado com fuso horário ao serializar `DATE` do MySQL (devolver `AAAA-MM-DD` como texto).

## Ajustes sugeridos no banco (revisar antes de aplicar)

```sql
ALTER TABLE users
  MODIFY telefone VARCHAR(11) NOT NULL,
  ADD COLUMN tipo ENUM('usuario','organizador','administrador') NOT NULL DEFAULT 'usuario',
  ADD COLUMN avatar VARCHAR(20) NULL,
  ADD COLUMN email_verificado TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN id_company INT UNSIGNED NULL,
  ADD UNIQUE KEY uq_users_email (email);

ALTER TABLE eventos
  MODIFY horaEvento TIME NOT NULL,
  MODIFY qtdIngresso INT UNSIGNED NULL,
  ADD COLUMN cidade ENUM('Coronel Fabriciano','Ipatinga','Timóteo') NOT NULL,
  ADD COLUMN categoria VARCHAR(20) NOT NULL,
  ADD COLUMN capa VARCHAR(100) NULL,
  ADD INDEX idx_eventos_busca (cidade, dataEvento);

CREATE TABLE IF NOT EXISTS eventos_salvos (
  id_user  INT UNSIGNED NOT NULL,
  id_event INT UNSIGNED NOT NULL,
  salvo_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_user, id_event),
  FOREIGN KEY (id_user)  REFERENCES users(id_user)    ON DELETE CASCADE,
  FOREIGN KEY (id_event) REFERENCES eventos(id_event) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inscricoes (
  id_user  INT UNSIGNED NOT NULL,
  id_event INT UNSIGNED NOT NULL,
  criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_user, id_event),
  FOREIGN KEY (id_user)  REFERENCES users(id_user)    ON DELETE CASCADE,
  FOREIGN KEY (id_event) REFERENCES eventos(id_event) ON DELETE CASCADE
) ENGINE=InnoDB;
```

A tabela `eventos` já tem `id_user` e `id_company`: o publicador do evento vem daí (administrador → `users.tipo`;
organizador → `companys`). Como não há cadastro de empresas na primeira entrega, todo evento terá `publicador.tipo = "administrador"`.
