# Eventos Vale do Aço

O **Eventos Vale do Aço** é um portal para divulgar atividades realizadas em Coronel Fabriciano, Timóteo e Ipatinga. A plataforma aproxima moradores, visitantes, organizadores e empresas dos eventos da região, oferecendo descoberta pública, pesquisa, filtros, inscrições e gerenciamento de atividades.

## Objetivo

Centralizar em um único serviço os eventos culturais, esportivos, comerciais, sociais e comunitários do Vale do Aço. Frequentadores poderão encontrar novidades e acompanhar eventos de interesse, enquanto organizadores poderão publicar, editar e cancelar suas divulgações. A administração também poderá cuidar dos eventos oficiais e da moderação de conteúdos enviados por terceiros.

## Público e principais experiências

- **Frequentadores:** criam contas, gerenciam dados e foto de perfil e acompanham os eventos agendados e notificações.
- **Organizadores:** cadastram eventos, séries interligadas e informações completas, acompanham inscrições e cancelam quando permitido.
- **Administradores:** aprovam eventos menores, mantêm os eventos oficiais da plataforma e administram avisos importantes.

O projeto contempla páginas públicas e áreas autenticadas, comunicação por e-mail, lembretes, , escolha de canais de notificação, status dos eventos e armazenamento seguro das informações. O projeto foi planejado para uma experiência rápida, responsiva e modular.

## Tecnologias

- HTML5 para estrutura das páginas.
- CSS3 e Bootstrap para apresentação responsiva.
- JavaScript para integração da interface com a API.
- Python com FastAPI para o servidor e a API.
- Jinja2 para renderização das páginas.
- Pydantic para validação de dados.
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
├── requirements.txt # Dependências Python
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
- **`requirements.txt`**: lista as bibliotecas Python necessárias para API, servidor, banco, validação, templates e configuração.

### Inicialização da aplicação

- **`app/__init__.py`**: marca `app` como um pacote Python e pode conter a inicialização mínima compartilhada.
- **`app/config.py`**: deve carregar as configurações do ambiente e fornecer acesso seguro a valores como banco, autenticação e SMTP.
- **`app/database.py`**: deve centralizar a conexão com MySQL, o ciclo de vida da conexão e operações ou sessões compartilhadas.
- **`app/main.py`**: deve criar a aplicação FastAPI, configurar templates e arquivos estáticos, registrar os roteadores e iniciar os serviços essenciais.

### Entidades

- **`app/models/__init__.py`**: reúne ou expõe as entidades disponíveis no pacote de modelos.
- **`app/models/empresa.py`**: representará organizadores ou empresas, incluindo identificação, razão social ou nome, contatos e vínculo com eventos.
- **`app/models/evento.py`**: representará eventos, séries, datas, horários, local, cidade, capacidade, ingresso, status e relação com organizadores.
- **`app/models/usuario.py`**: representará contas de frequentadores e administradores, dados pessoais, autenticação e preferências de contato.

### Rotas

- **`app/routers/__init__.py`**: identifica o diretório de rotas como pacote e pode centralizar exportações comuns.
- **`app/routers/auth_routes.py`**: deve conter cadastro, login, logout, recuperação de credenciais e gerenciamento da sessão ou autenticação.
- **`app/routers/evento_routes.py`**: deve listar, pesquisar, filtrar, cadastrar, editar, cancelar e detalhar eventos.
- **`app/routers/painel_routes.py`**: deve atender os painéis de organizadores e administradores, incluindo inscrições, moderação e indicadores.

### Schemas

- **`app/schemas/__init__.py`**: identifica o pacote de schemas e pode expor modelos usados por diferentes módulos.
- **`app/schemas/evento_schema.py`**: deve validar dados recebidos e definir respostas completas ou resumidas de eventos.
- **`app/schemas/usuario_schema.py`**: deve validar cadastros, autenticação, atualização de perfil e dados de contato dos usuários.

### Serviços

- **`app/services/email_service.py`**: centraliza o envio por SMTP de confirmações, alterações de status, lembretes e outros avisos.

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

### Backend Python

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Preencha o arquivo `.env` com as credenciais locais do MySQL e, quando necessário, com os dados SMTP.

### Dependências da interface

```bash
npm install
```

## Execução

Com o ambiente virtual ativo e o banco configurado:

```bash
uvicorn app.main:app --reload
```

A documentação interativa da API ficará disponível no endereço exibido pelo FastAPI no terminal, normalmente em `http://127.0.0.1:8000/docs`.

## Diretrizes de contribuição

- Preserve a separação entre modelos, schemas, rotas e serviços.
- Não versione arquivos `.env`, senhas, chaves ou credenciais.
- Valide dados no servidor e no formulário antes de persistir.
- Mantenha mensagens de erro claras, códigos HTTP apropriados e respostas consistentes.
- Evite registrar informações sensíveis em logs.