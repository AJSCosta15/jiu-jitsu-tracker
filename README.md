# Jiu-Jitsu Tracker Dashboard

Painel de visualização de treinos de Jiu-Jitsu integrado com o Notion. Apresenta métricas de consistência, tempo acumulado de rola, gráficos mensais e monitoramento de metas em tempo real.

## 🛠️ Arquitetura
*   **Front-end:** HTML5, CSS3 (Vanilla) e JavaScript (ES6). Bibliotecas auxiliares: Chart.js (via CDN).
*   **Back-end:** Node.js com Express para servir os arquivos estáticos e agir como proxy para a API do Notion (@notionhq/client). A lógica fica em `lib/` (`app.js`, `notion.js`, `normalize.js`, `cache.js`) e o `server.js` apenas liga tudo.
*   **Front-end modular:** módulos ES em `public/js/` (cálculos testáveis, UI de Treinos e de Graduações, abas).

## 🥋 Abas
*   **Treinos:** métricas de consistência, rola acumulada, gráficos mensais e metas.
*   **Graduações:** linha do tempo das faixas/graus com a quantidade de treinos e de horas entre cada marco. Acessível direto por `#graduacoes`.

## ⚡ Cache
As respostas do Notion ficam em cache por 5 minutos. Para forçar uma nova leitura, use `?refresh=1` na rota, por exemplo `/api/treinos?refresh=1`.

## 🚀 Como Rodar

1. Certifique-se de que possui o Node.js instalado na máquina.
2. Clone o repositório ou navegue até a pasta do projeto.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Crie um arquivo `.env` na raiz seguindo o `.env.example`:
   ```env
   PORT=3000
   NOTION_API_KEY=sua_chave_do_notion
   NOTION_DATABASE_ID=seu_id_do_banco_de_treinos
   NOTION_GRADUACOES_DB_ID=seu_id_do_banco_de_graduacoes
   ```
   A integração do Notion ("Jiu Jitsu Tracker") precisa estar conectada aos **dois** bancos (Treinos e Graduações): abra cada banco no Notion, menu `...` > Conexões e adicione a integração. Se `NOTION_GRADUACOES_DB_ID` estiver vazio, a aba Treinos continua funcionando e a aba Graduações mostra uma mensagem de fallback. Na Vercel, cadastre a mesma variável nas Environment Variables do projeto.
5. (Opcional) Rode os testes:
   ```bash
   npm test
   ```
6. Inicie o servidor:
   ```bash
   npm run dev
   ```
7. Acesse no navegador em `http://localhost:3000`.

---

## 📜 Histórico de Desenvolvimento

### 19/10/2026
*   **Ferramenta Utilizada:** Claude Code
*   **O que foi tentado e falhou:** Integração do Notion sem acesso ao banco de Graduações: a integração "Jiu Jitsu Tracker" precisa ser compartilhada com esse banco (Conexões) para a aba carregar dados reais.
*   **O que deu certo:** API normalizada com cache de 5 min (`?refresh=1`), erros limpos e nova rota `/api/graduacoes`; front reorganizado em módulos ES com cálculos testados e escape de HTML; nova aba **Graduações** com linha do tempo e treinos/horas entre marcos; nova variável `NOTION_GRADUACOES_DB_ID`; suíte de testes com `npm test` (node:test). Falha cruzada verificada: sem a variável, Treinos segue normal e Graduações exibe o fallback.

### 28/05/2026 (Task 2)
*   **Ferramenta Utilizada:** Antigravity IDE (Subagente Implementador)
*   **O que foi tentado e falhou:** Nenhuma falha nos arquivos; o comando de terminal `git status` sofreu timeout devido à ausência de resposta manual do usuário no prompt de permissão do sandbox.
*   **O que deu certo:** Implementação e estilização da **Task 2: Header com LED de Sync e Barra de Filtros**. Reestruturação do `<header>` no HTML para incluir o LED indicador de sincronização (`sync-led` e `sync-status`) e remoção do indicador antigo do card de filtros. Adição das novas regras no `index.css` para a barra de filtros (pills com gradiente no estado ativo e foco acessível) e controle dinâmico de cores do LED (`led-teal`/`led-red` para modo demo/erro) no `main.js`.

### 28/05/2026 (Task 1)
*   **Ferramenta Utilizada:** Antigravity IDE (Subagente Implementador)
*   **O que foi tentado e falhou:** Nenhuma falha encontrada nesta etapa.
*   **O que deu certo:** Implementação da **Task 1: Fundação de CSS — Tokens, Fontes e Base** do Redesign Arena. Adição da fonte Oswald ao HTML e substituição dos design tokens base, estilos do body, scrollbar e card genérico no index.css com a identidade visual da Arena.

### 23/05/2026
*   **Ferramenta Utilizada:** Antigravity IDE
*   **O que foi tentado e falhou:** Criação do documento de especificação como artefato (`IsArtifact: true`), o que resultou em erro de caminho, pois especificações de design do projeto devem residir na estrutura de diretórios do repositório local.
*   **O que deu certo:** Aprovação da especificação de design da **Abordagem A (Sports Tech / Cyber Neon)**, salvando-a em `docs/superpowers/specs/2026-05-23-dashboard-redesign.md`, e criação do plano de implementação correspondente em `docs/superpowers/plans/2026-05-23-dashboard-redesign.md` com 9 tarefas detalhadas de TDD e estilização.
