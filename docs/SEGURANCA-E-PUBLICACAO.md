# Segurança e publicação

Checklist para colocar o projeto no GitHub e, depois, em produção sem expor dados sensíveis.

## 1. O que foi verificado no repositório enviado

| Item | Resultado |
|---|---|
| `.env` já foi versionado em algum commit? | **Não** (0 commits tocam `.env`) e ele está no `.gitignore`. |
| Valores do `.env` | Eram apenas exemplos/espaços vazios — nenhuma credencial real encontrada. |
| Credenciais no histórico (30 commits, todos os branches) | Varredura por padrões de `senha/secret/token/api_key/SMTP/MySQL` **não encontrou valores reais**. Só aparecem nomes de variáveis em `.env.example` e código antigo que lia variáveis. |
| `node_modules/` no histórico | Foi commitado em algum ponto (inflou o `.git` para ~10 MB). Não é sensível; hoje está ignorado. |
| Código Python antigo no histórico | Existe (`app/*.py`). Não é sensível. |
| E-mails nos commits | Cada commit expõe o e-mail do autor — inclusive e-mails pessoais (Gmail) e institucionais da equipe. Se o repositório for público, **são públicos**. |
| Imagem `eventoInicio.png` | 2,4 MB, 5157×3438 px, parece ilustração de banco de imagens (estilo vetorial). Não é usada em nenhuma tela. **Confira a licença/atribuição** antes de publicar, ou remova. |

Limites: a varredura procurou padrões comuns; ela não substitui uma ferramenta dedicada (seção 3).
O **zip que você enviou continha o `.env`** — não há problema aqui porque eram valores de exemplo, mas
**nunca** envie `.env` em zips, prints ou conversas quando ele tiver credenciais reais (se algum dia
tiver acontecido, troque a senha/chave imediatamente).

## 2. Aplicando as mudanças no seu repositório

O pacote entregue é a pasta do projeto **sem** `.git`, `node_modules` e `.env`.
**Faça um backup da pasta do projeto antes** (copie-a para outro lugar). Depois, na pasta do projeto:

```bash
# 1) Apague o que ficou obsoleto
git rm -r --cached .vscode
rm -rf app docs tests .vscode

# 2) Copie o conteúdo do pacote por cima (app/, docs/, tests/, README, package.json, .gitignore,
#    .env.example, .gitattributes). Mantenha o seu .env local (continua ignorado).

# 3) Instale (gera um package-lock.json atualizado — versione o arquivo novo)
npm install

# 4) Teste e confira o que vai ser commitado ANTES de commitar
npm test
git add -A
git status
git check-ignore -v .env          # deve mostrar a regra do .gitignore
git diff --cached --stat
```

Arquivos que deixam de existir em relação ao projeto original: `app/__init__.js` e `app/*/__init__.js` (viram `index.js`),
os `*_routes.js`, `*_schema.js` e `email_service.js` em snake_case, `app/static/css/login.css` e `style.css`
(agora `estilo.css`), os JS antigos (`index.js`, `login.js`), `.gitkeep`, `.vscode/settings.json` e as telas antigas.

## 3. Antes de cada push

- [ ] `git status` e `git diff --cached`: nenhum `.env`, `.zip`, `uploads/`, dump de banco ou chave privada.
- [ ] Rode um detector de segredos, por exemplo [gitleaks](https://github.com/gitleaks/gitleaks): `gitleaks git` (varre o histórico) e `gitleaks git --staged` (varre só o que está prestes a ser commitado).
- [ ] No GitHub: **Settings → Code security** → ligue *Secret scanning* e *Push protection* e o *Dependabot alerts*.
- [ ] Ative autenticação em dois fatores na conta e proteja o branch `main` (exigir Pull Request).
- [ ] `npm run audit` (vulnerabilidades nas dependências).
- [ ] Nunca coloque segredo em `README`, `docs/`, comentários, exemplos de código ou *issues*.

**E-mails nos commits:** para os próximos commits, use o e-mail "noreply" do GitHub
(*Settings → Emails → Keep my email addresses private*). Os commits antigos continuam mostrando os e-mails;
reescrever o histórico muda os hashes de todos os colegas — só vale a pena se a equipe quiser, e deve ser
combinado antes (`git filter-repo`).

**Se um segredo vazar:** (1) **revogue/troque** a credencial imediatamente — apagar o arquivo não adianta,
pois clones e forks mantêm o histórico; (2) só depois limpe o histórico, se necessário.

## 4. O que o projeto já faz por segurança

- `.env` ignorado; `.env.example` sem nenhum valor real; `config.js` é o único leitor do `.env`.
- Em produção o servidor **se recusa a iniciar** com `SECRET_KEY` fraca ou senha de banco ausente.
- `helmet` com política de conteúdo (CSP) restritiva: permite recursos do próprio site, Bootstrap via jsDelivr e a fonte Inter via Google Fonts.
- Só `/static` é público; as telas são entregues por uma lista fixa de rotas.
- Texto vindo de usuários entra nas telas por `textContent`/`criarElemento`, nunca por `innerHTML` (sem XSS); links só `http(s)`; `?proximo=` aceita apenas caminhos internos.
- E-mails: código de 6 dígitos com validade de 10 min, 5 tentativas, uso único, hash em memória, reenvio com intervalo, limite por IP e por destinatário; conteúdo escapado; quebras de linha removidas dos campos (sem injeção de cabeçalho).
- Senha do SMTP só no `.env` (senha de app do Google); nada de e-mail ou código nos logs em produção.
- Dados do cartão na tela de pagamento nunca são lidos nem enviados.
- Corpos de requisição limitados a 100 KB; `x-powered-by` desligado; erros em produção sem detalhes técnicos; respostas comprimidas.
- Consultas ao banco com `?` (prepared statements) e `multipleStatements: false`.
- Bootstrap e Bootstrap Icons carregados do jsDelivr com versões fixas e integridade SRI. A hospedagem precisa permitir acesso ao CDN.

## 5. O que ainda depende de você / da equipe da API

- **O modo simulado precisa estar DESLIGADO em produção** (`usarDadosSimulados: false` em `app/static/js/configuracao.js`):
  ele inclui contas de teste e guarda tudo no navegador.
- **Autorização só vale na API.** As telas protegem apenas a navegação; qualquer pessoa pode chamar a API direto.
  Veja a lista em `docs/CONTRATO-DA-API.md` (permissões de administrador, dono dos dados, bcrypt, validações, `tokenVerificacao`).
- **Sessão sem cookie:** o usuário logado fica no armazenamento do navegador (e o `token`, se houver). Isso o deixa exposto a
  qualquer XSS — por isso o front não usa `innerHTML` com dados externos. Prefira tokens de vida curta.
- **Códigos de e-mail em memória:** somem ao reiniciar o servidor e não funcionam com várias instâncias. Para produção em escala, mover para banco/Redis.
- **Rotas de e-mail sem login:** têm limite por IP e por destinatário, mas qualquer pessoa pode pedir um código para um e-mail.
  Mantenha os limites e, se possível, exija token do usuário logado na rota `/inscricao`.
- **CSRF:** sem cookie de sessão não há CSRF clássico; se a API passar a usar cookies, adicione `SameSite` e verificação de `Origin`.
- **Limite de tentativas de login** (`express-rate-limit` ou similar) na API.
- **Uploads de capa:** reprocessar a imagem, limite de 2 MB, nome gerado pelo servidor, sem SVG, fora de `static`.
- **Logs:** não registrar senhas, tokens, códigos nem corpo das requisições.

## 6. Produção

- Defina as variáveis **no painel da hospedagem** (não suba `.env`): `NODE_ENV=production`, `SECRET_KEY`, `MYSQL_*`, `MYSQL_SSL=true` se o provedor exigir, `SMTP_*` (senha de app do Google), `PORT`/`HOST` conforme a plataforma.
- **HTTPS obrigatório** (a maioria das plataformas fornece). O cookie `secure` e o `trust proxy` do `main.js` dependem disso.
- **Banco de dados:** usuário exclusivo da aplicação com privilégios mínimos (nada de `root`), sem acesso público pela internet, backups automáticos testados.
- Instale com `npm ci --omit=dev` (usa o `package-lock.json` exato) e rode `npm start`. Atualize dependências com frequência.
- **Uploads** em disco persistente ou armazenamento de objetos (disco de hospedagens costuma ser apagado a cada deploy).
- Monitore o endpoint `/health` e os logs de erro.

## 7. LGPD (o sistema coleta dados pessoais)

- Coleta: nome, e-mail, telefone, foto e, nos organizadores, CNPJ e dados de contato. Peça só o necessário.
- As páginas **Termos de Uso** e **Política de Privacidade** existem com texto **provisório** (comentário `TEXTO PROVISÓRIO` no HTML): substitua por um texto revisado por responsável jurídico. A **Política de Cookies** já lista os cookies reais e o banner de consentimento está implementado.
- A tela de cadastro já tem a caixa de aceite; a API deve guardar a data/hora do aceite.
- Já há na interface "Baixar meus dados" (gerado no navegador) e "Excluir conta" (chama a API); a API precisa apagar/anonimizar os dados de fato.
- A fonte **Inter** é carregada do Google Fonts (o navegador do visitante contata o Google). Se quiser evitar isso, instale `@fontsource/inter` e sirva a fonte do próprio site (e remova `fonts.googleapis.com`/`fonts.gstatic.com` da CSP em `main.js`).
