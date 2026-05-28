# Jiu-Jitsu Tracker Dashboard

Painel de visualização de treinos de Jiu-Jitsu integrado com o Notion. Apresenta métricas de consistência, tempo acumulado de rola, gráficos mensais e monitoramento de metas em tempo real.

## 🛠️ Arquitetura
*   **Front-end:** HTML5, CSS3 (Vanilla) e JavaScript (ES6). Bibliotecas auxiliares: Chart.js (via CDN).
*   **Back-end:** Node.js com Express para servir os arquivos estáticos e agir como proxy para a API do Notion (@notionhq/client).

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
   NOTION_DATABASE_ID=seu_id_do_banco
   ```
5. Inicie o servidor:
   ```bash
   npm run dev
   ```
6. Acesse no navegador em `http://localhost:3000`.

---

## 📜 Histórico de Desenvolvimento

### 28/05/2026
*   **Ferramenta Utilizada:** Antigravity IDE (Subagente Implementador)
*   **O que foi tentado e falhou:** Nenhuma falha encontrada nesta etapa.
*   **O que deu certo:** Implementação da **Task 1: Fundação de CSS — Tokens, Fontes e Base** do Redesign Arena. Adição da fonte Oswald ao HTML e substituição dos design tokens base, estilos do body, scrollbar e card genérico no index.css com a identidade visual da Arena.

### 23/05/2026
*   **Ferramenta Utilizada:** Antigravity IDE
*   **O que foi tentado e falhou:** Criação do documento de especificação como artefato (`IsArtifact: true`), o que resultou em erro de caminho, pois especificações de design do projeto devem residir na estrutura de diretórios do repositório local.
*   **O que deu certo:** Aprovação da especificação de design da **Abordagem A (Sports Tech / Cyber Neon)**, salvando-a em `docs/superpowers/specs/2026-05-23-dashboard-redesign.md`, e criação do plano de implementação correspondente em `docs/superpowers/plans/2026-05-23-dashboard-redesign.md` com 9 tarefas detalhadas de TDD e estilização.
