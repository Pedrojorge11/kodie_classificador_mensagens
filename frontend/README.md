# Anubis Helpdesk — Front-end

Interface web responsiva do Anubis Helpdesk, desenvolvida em React e TypeScript para abertura, classificação e gerenciamento inteligente de chamados de atendimento.

## Funcionalidades

- Cadastro e autenticação de usuários.
- Autenticação por token JWT.
- Painel de indicadores de atendimento.
- Abertura de chamados com classificação automática por IA.
- Visualização da categoria, prioridade, sentimento e confiança da classificação.
- Exibição do resumo e da ação sugerida pela IA.
- Consulta de chamados por protocolo.
- Histórico de atendimentos.
- Filtros por categoria e status.
- Atualização do status dos chamados.
- Roteamento automático por setor e fila de atendimento.

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- CSS
- ESLint
- Nginx
- Docker

## Pré-requisitos

- Node.js 22.12 ou superior, preferencialmente da versão 22 LTS.
- npm.
- API FastAPI configurada e em execução.

## Execução local

A partir da raiz do projeto, execute:

```powershell
cd frontend
npm install
npm run dev
```

A interface estará disponível em:

http://localhost:5173

Por padrão, o front-end utiliza a API disponível em:

http://127.0.0.1:8000

## Configuração da API

Caso seja necessário utilizar outro endereço para o back-end, crie um arquivo `.env` dentro da pasta `frontend` com a variável:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Não armazene chaves de API, senhas ou segredos JWT nas variáveis de ambiente do front-end.

## Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm install` | Instala as dependências |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a versão de produção |
| `npm run lint` | Executa a análise estática do código |
| `npm run preview` | Visualiza a versão de produção localmente |

## Execução com Docker

A partir da raiz do projeto, execute:

```powershell
docker compose up --build
```

O front-end será compilado e servido pelo Nginx.

Acesse:

- Portal Web: http://localhost:8080
- API FastAPI: http://localhost:8000
- Swagger: http://localhost:8000/docs

## Documentação geral

Para informações sobre a arquitetura do sistema, integração com Google Gemini, banco de dados, autenticação, automação n8n e testes, consulte o [README principal](../README.md).

## Autor

Desenvolvido por **Pedro Jorge da Silva**.

[GitHub](https://github.com/Pedrojorge11)