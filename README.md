# Eventos Vale do Aço

O **Eventos Vale do Aço** é um portal para divulgar atividades realizadas em Coronel Fabriciano, Timóteo e Ipatinga. A plataforma aproxima moradores, visitantes, organizadores e empresas dos eventos da região, oferecendo descoberta pública, pesquisa, filtros, inscrições e gerenciamento de atividades.

## Objetivo

Centralizar em um único serviço os eventos culturais, esportivos, comerciais, sociais e comunitários do Vale do Aço. Frequentadores poderão encontrar novidades e acompanhar eventos de interesse, enquanto organizadores poderão publicar, editar e cancelar suas divulgações. A administração também poderá cuidar dos eventos oficiais e da moderação de conteúdos enviados por terceiros.

## Público e principais experiências

- **Frequentadores:** criam contas, gerenciam dados e foto de perfil e acompanham os eventos agendados e notificações.
- **Organizadores:** cadastram eventos, séries interligadas e informações completas, acompanham inscrições e cancelam quando permitido.
- **Administradores:** aprovam eventos menores, mantêm os eventos oficiais da plataforma e administram avisos importantes.

O projeto contempla páginas públicas e áreas autenticadas, comunicação por e-mail, lembretes, escolha de canais de notificação, status dos eventos e armazenamento seguro das informações. O projeto foi planejado para uma experiência rápida, responsiva e modular.

## Tecnologias

- HTML5 para estrutura das páginas.
- CSS3 e Bootstrap para apresentação responsiva.
- JavaScript para a interface e o servidor.
- Node.js para executar a aplicação e as rotas HTTP.
- HTML dinâmico para as páginas da aplicação.
- MySQL para persistência.
- SMTP para envio de e-mails.

## Estrutura do projeto

```text
Eventos-Vale-do-A-o/
├── app/
│   ├── models/      # Representações das entidades da aplicação
│   ├── routers/     # Rotas HTTP agrupadas por responsabilidade
│   ├── schemas/     # Contratos de entrada e saída da API
│   ├── services/    # Integrações e regras de apoio
│   ├── static/      # Arquivos CSS, JavaScript e imagens
│   └── templates/   # Páginas HTML renderizadas pelo servidor
├── index.html       # Protótipo público inicial
├── login.html       # Protótipo inicial de autenticação
├── package.json     # Dependências e metadados do ambiente JavaScript
└── README.md        # Visão geral e mapa do projeto
```

## Guia de arquivos

### Arquivos da raiz

- **`.env.example`**: modelo das variáveis de ambiente. Deve informar a configuração MySQL, chave secreta, ambiente de execução e parâmetros SMTP sem incluir senhas reais.
- **`.gitignore`**: define arquivos locais que não devem ser versionados, como ambiente virtual, segredos, dependências, caches e logs.
- **`.vscode/settings.json`**: contém preferências locais do VS Code para o projeto, como uso automático do arquivo de ambiente no terminal.
- **`LICENSE`**: mantém os termos da licença MIT aplicáveis ao código, ao copyright e às responsabilidades de uso.
- **`README.md`**: apresenta o objetivo do portal, público atendido, tecnologias, estrutura, instalação, execução e responsabilidade de cada arquivo.
- **`index.html`**: será a página HTML pública inicial do protótipo ou redirecionamento para a página principal do aplicativo.
- **`login.html`**: será o protótipo independente da tela de autenticação com campos de e-mail e senha e ações de recuperação e cadastro.
- **`package.json`**: deve registrar metadados do projeto JavaScript, scripts de desenvolvimento e o Bootstrap usado pela interface.
- **`package-lock.json`**: registra as versões exatas das dependências JavaScript para permitir instalações reproduzíveis.

### Inicialização da aplicação

- **`app/__init__.js`**: reúne as exportações compartilhadas do módulo principal da aplicação.
- **`app/config.js`**: carrega as configurações do ambiente e fornece acesso seguro a valores como banco, autenticação e SMTP.
- **`app/database.js`**: centraliza a configuração da conexão MySQL, o ciclo de vida da conexão e as operações compartilhadas.
- **`app/main.js`**: inicia o servidor Node.js, registra as rotas e disponibiliza a interface estática.

### Entidades

- **`app/models/__init__.js`**: reúne ou expõe as entidades disponíveis no diretório de modelos.
- **`app/models/empresa.js`**: representará organizadores ou empresas, incluindo identificação, razão social ou nome, contatos e vínculo com eventos.
- **`app/models/evento.js`**: representará eventos, séries, datas, horários, local, cidade, capacidade, ingresso, status e relação com organizadores.
- **`app/models/usuario.js`**: representará contas de frequentadores e administradores, dados pessoais, autenticação e preferências de contato.

### Rotas

- **`app/routers/__init__.js`**: centraliza as exportações dos roteadores HTTP.
- **`app/routers/auth_routes.js`**: contém cadastro, login, logout, recuperação de credenciais e gerenciamento da sessão ou autenticação.
- **`app/routers/evento_routes.js`**: lista, pesquisa, filtra, cadastra, edita, cancela e detalha eventos.
- **`app/routers/painel_routes.js`**: atende os painéis de organizadores e administradores, incluindo inscrições, moderação e indicadores.

### Schemas

- **`app/schemas/__init__.js`**: centraliza os contratos de validação usados pela aplicação.
- **`app/schemas/evento_schema.js`**: valida dados recebidos e define respostas completas ou resumidas de eventos.
- **`app/schemas/usuario_schema.js`**: valida cadastros, autenticação, atualização de perfil e dados de contato dos usuários.

### Serviços

- **`app/services/email_service.js`**: centraliza o envio por SMTP de confirmações, alterações de status, lembretes e outros avisos.

### Interface estática

- **`app/static/css/style.css`**: define estilos globais, identidade visual, componentes e adaptações responsivas das páginas.
- **`app/static/js/api.js`**: fará a comunicação assíncrona com a API e atualizará a interface sem recarregamentos desnecessários.
- **`app/static/css/.gitkeep`** e **`app/static/js/.gitkeep`**: placeholders usados enquanto os diretórios não possuem mais arquivos versionados.
- **`app/static/img/.gitkeep`**: placeholder do diretório reservado às imagens públicas da aplicação.
- **`app/static/img/eventoInicio.jpg`**: imagem ilustrativa usada na capa da página inicial.

### Templates

- **`app/templates/base.html`**: conterá o layout compartilhado da aplicação, com cabeçalho, navegação, rodapé e blocos substituíveis pelas demais páginas.
- **`app/templates/index.html`**: exibirá a apresentação do portal e a lista pública de eventos com pesquisa e filtros.
- **`app/templates/cadastrar.html`**: exibirá os formulários de cadastro de frequentadores e organizadores.
- **`app/templates/login.html`**: exibirá autenticação por e-mail e senha e links para cadastro e recuperação.
- **`app/templates/detalhe.html`**: exibirá todas as informações relevantes de um evento e ações disponíveis ao usuário.
- **`app/templates/perfil.html`**: permitirá visualizar e alterar dados pessoais, foto de perfil e preferências de comunicação.

## Instalação

### Backend JavaScript

```bash
copy .env.example .env
npm install
```

Preencha o arquivo `.env` com as credenciais locais do MySQL e, quando necessário, com os dados SMTP.

### Dependências da interface

```bash
npm install express cors
```

## Execução

Com o banco configurado:

```bash
node app/main.js
```

O servidor ficará disponível no endereço exibido no terminal, normalmente em `http://127.0.0.1:3000`.

## Diretrizes de contribuição

- Preserve a separação entre modelos, schemas, rotas e serviços.
- Não versione arquivos `.env`, senhas, chaves ou credenciais.
- Valide dados no servidor e no formulário antes de persistir.
- Mantenha mensagens de erro claras, códigos HTTP apropriados e respostas consistentes.
- Evite registrar informações sensíveis em logs.