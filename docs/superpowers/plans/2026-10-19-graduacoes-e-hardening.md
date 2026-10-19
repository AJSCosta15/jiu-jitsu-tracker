# Aba Graduações + Ajustes de Base — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar a aba "Graduações" (linha do tempo com treinos e horas entre marcos) e endurecer a base (payload normalizado, escape, cache, testes) sem regressão na aba Treinos.

**Architecture:** O backend Express é dividido em `lib/` (consulta ao Notion, normalizadores puros, cache, app). O `server.js` só faz o `listen`. O frontend vira módulos ES em `public/js/`: os cálculos ficam em módulos puros testados com `node:test`, e o DOM fica em módulos de UI. As duas abas compartilham os dados de treinos já carregados.

**Tech Stack:** Node 24, Express 4, `@notionhq/client` 2.x, JS vanilla (ES modules), Chart.js via CDN, `node:test`. Sem dependências novas.

**Spec:** `docs/superpowers/specs/2026-10-19-graduacoes-e-hardening-design.md`

## Global Constraints

- Sem senha/autenticação; link público.
- Sem dependências novas; sem framework, sem bundler.
- Aba Treinos: mesmos números de hoje (meta **130**, anel com `CIRC = 565.48`, limiar de ritmo **±1.5**, faixas de cor da projeção ≥1 teal, ≥0.9 blue, ≥0.75 warn, senão danger).
- Nova env: `NOTION_GRADUACOES_DB_ID` (valor atual: `f3ad096e-f617-46a5-859f-41a6a165102e`).
- Cache TTL **5 min**; `?refresh=1` ignora o cache.
- Erros para o cliente: só `{ error: "<mensagem amigável>" }`; o detalhe vai para `console.error`.
- Datas sempre como string local `YYYY-MM-DD` (nunca `new Date("YYYY-MM-DD")` sem `T00:00:00`).
- Todo texto vindo do Notion passa por `escapeHtml` antes de entrar em `innerHTML`.
- Identidade "Arena": tokens existentes de `public/index.css`, Oswald para números e títulos, Inter para texto; responsivo até 320px; respeitar `prefers-reduced-motion`.
- "Há quanto tempo na faixa" conta a partir do **marco mais antigo com a faixa atual**, não do último grau.

## Review Focus

1. **Treino no mesmo dia de um marco**: conta para o intervalo que *começa* naquele marco, nunca para os dois. Teste em Task 4.
2. **Banco de graduações inacessível (404, env ausente)**: a aba Treinos segue funcionando e o LED não fica vermelho por causa disso; a aba Graduações mostra o erro. Teste em Task 2 (rota retorna `fallback`/erro limpo) e verificação manual em Task 6.
3. **Texto do Notion com `<`, `&`, aspas**: aparece literal e não vira HTML. Teste em Task 3 (`escapeHtml`) e uso nos dois renders.
4. **Fim de mês na diferença de calendário** (ex.: 31/01 → 28/02, 29/02 em ano bissexto): sem dias negativos nem `NaN`. Teste em Task 4.
5. **Graduação sem data ou sem faixa**: é ignorada na linha do tempo, sem quebrar o resto. Teste em Task 4.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `lib/normalize.js` (novo) | `normalizeTreino`, `normalizeGraduacao`: página do Notion → objeto plano |
| `lib/cache.js` (novo) | cache TTL em memória |
| `lib/notion.js` (novo) | `queryAll(notion, databaseId)` com paginação |
| `lib/app.js` (novo) | `createApp(deps)`: rotas `/api/treinos`, `/api/graduacoes` e os estáticos |
| `server.js` (modificar) | carrega o env, cria o client do Notion, `createApp`, `listen` |
| `public/js/package.json` (novo) | `{ "type": "module" }` para o `node:test` importar os módulos do browser |
| `public/js/dom.js` | `escapeHtml` |
| `public/js/calc-treinos.js` | filtros, KPIs, meta/ritmo/projeção (puros) |
| `public/js/calc-graduacoes.js` | diferença de calendário, duração formatada, timeline, resumo (puros) |
| `public/js/api.js` | `fetchTreinos(refresh)`, `fetchGraduacoes(refresh)` |
| `public/js/treinos-ui.js` | gráficos, filtros, KPIs, tabela (DOM) |
| `public/js/graduacoes-ui.js` | destaque e linha do tempo (DOM) |
| `public/js/main.js` | ponto de entrada: abas, hash, carregamento, botão Atualizar |
| `public/main.js` (remover) | substituído por `public/js/main.js` |
| `tests/*.test.js` / `tests/*.test.mjs` | testes `node:test` |

---

### Task 1: Normalizadores e cache do backend

**Files:**
- Create: `lib/normalize.js`, `lib/cache.js`, `tests/normalize.test.js`, `tests/cache.test.js`
- Modify: `package.json` (script `"test": "node --test tests/"`)

**Interfaces:**
- Produces:
  - `normalizeTreino(page) -> { id, nome, data, duracaoMin, modalidade, tipo, intensidade, foco }`. Lê `Treino` (title → `nome`, padrão `'Treino (Sem nome)'`), `Data.date.start` (padrão `''`), `Duração (min)` (padrão `0`), `Modalidade`, `Tipo` e `Intensidade` (select name, padrão `''`), `Foco do Treino` (rich_text[0].plain_text, padrão `''`).
  - `normalizeGraduacao(page) -> { id, titulo, data, faixa, grau, academia, professor, observacoes }`. Lê `Graduação` (title), `Data`, `Faixa` e `Grau` (select), `Academia / Evento`, `Professor` e `Observações` (rich_text unindo **todos** os `plain_text`). Padrão `''` em todos.
  - `createCache(ttlMs, now = Date.now) -> { get(key) -> value|undefined, set(key, value) }`

- [ ] **Step 0: Linha de base de paridade**: com o código atual, `npm run dev` e anotar em `docs/superpowers/plans/paridade-baseline.md` os valores da tela (KPIs, %, ritmo, projeção, por semana, título da tabela) com filtros "Todos" e com "2026 + Gi". Esse arquivo é usado na Task 3.

- [ ] **Step 1: Write failing tests** (`tests/normalize.test.js`)

```js
const test = require('node:test');
const assert = require('node:assert');
const { normalizeTreino, normalizeGraduacao } = require('../lib/normalize');

test('normalizeTreino extrai campos usados pelo painel', () => {
  const page = { id: 'p1', properties: {
    'Treino': { title: [{ plain_text: 'Treino 72' }] },
    'Data': { date: { start: '2026-04-10' } },
    'Duração (min)': { number: 90 },
    'Modalidade': { select: { name: 'Gi' } },
    'Tipo': { select: { name: 'Técnica' } },
    'Intensidade': { select: { name: 'Alta' } },
    'Foco do Treino': { rich_text: [{ plain_text: 'Passagem' }] },
  }};
  assert.deepStrictEqual(normalizeTreino(page), { id: 'p1', nome: 'Treino 72', data: '2026-04-10',
    duracaoMin: 90, modalidade: 'Gi', tipo: 'Técnica', intensidade: 'Alta', foco: 'Passagem' });
});

test('normalizeTreino com propriedades vazias usa padrões', () => {
  assert.deepStrictEqual(normalizeTreino({ id: 'p2', properties: {} }), { id: 'p2', nome: 'Treino (Sem nome)',
    data: '', duracaoMin: 0, modalidade: '', tipo: '', intensidade: '', foco: '' });
});

test('normalizeGraduacao extrai marco da graduação', () => {
  const page = { id: 'g1', properties: {
    'Graduação': { title: [{ plain_text: 'Faixa Azul' }] },
    'Data': { date: { start: '2026-10-18' } },
    'Faixa': { select: { name: 'Azul' } },
    'Grau': { select: { name: 'Sem grau' } },
    'Academia / Evento': { rich_text: [{ plain_text: 'Diego Nery Jiu-Jitsu' }] },
    'Professor': { rich_text: [{ plain_text: 'Rick Dias' }] },
    'Observações': { rich_text: [{ plain_text: 'Primeiro ' }, { plain_text: 'dia' }] },
  }};
  assert.deepStrictEqual(normalizeGraduacao(page), { id: 'g1', titulo: 'Faixa Azul', data: '2026-10-18',
    faixa: 'Azul', grau: 'Sem grau', academia: 'Diego Nery Jiu-Jitsu', professor: 'Rick Dias', observacoes: 'Primeiro dia' });
});
```

`tests/cache.test.js`: com `now` controlado, `set('a',1)` → `get('a')===1` em t+299999 e `undefined` em t+300001 (ttl 300000).

- [ ] **Step 2: Run** `npm test` → Expected: FAIL (`Cannot find module '../lib/normalize'`)
- [ ] **Step 3: Implement** `lib/normalize.js` e `lib/cache.js` (CommonJS, funções puras, sem mutar a entrada).
- [ ] **Step 4: Run** `npm test` → Expected: PASS
- [ ] **Step 5: Commit** `feat: normalizadores do Notion e cache TTL com testes`

---

### Task 2: App Express com rotas normalizadas, cache e erros limpos

**Files:**
- Create: `lib/notion.js`, `lib/app.js`, `tests/app.test.js`
- Modify: `server.js` (passa a ter só env + client + `createApp` + `listen`; remover `cors`), `.env.example` (adicionar `NOTION_GRADUACOES_DB_ID=`), `package.json` (remover a dependência `cors`)

**Interfaces:**
- Consumes: `normalizeTreino`, `normalizeGraduacao`, `createCache` (Task 1)
- Produces:
  - `queryAll(notion, databaseId) -> Promise<page[]>` (laço de `next_cursor`, como no `server.js` atual)
  - `createApp({ queryDatabase, treinosDbId, graduacoesDbId, ttlMs = 300000, now }) -> express app`, onde `queryDatabase(dbId) -> Promise<page[]>`.
  - `GET /api/treinos` → `{ fallback: false, results: Treino[] }`. Sem `treinosDbId` ou com `'seu_database_id_aqui'`: `{ fallback: true, message: 'Configure as chaves do Notion no .env', results: [] }`.
  - `GET /api/graduacoes` → `{ fallback: false, results: Graduacao[] }` ordenado por `data` crescente. Sem `graduacoesDbId`: `{ fallback: true, message: 'Configure NOTION_GRADUACOES_DB_ID', results: [] }`.
  - Erro em qualquer rota: status 500 + `{ error: 'Erro ao buscar dados do Notion' }`; com `error.status === 404` ou `error.code === 'object_not_found'`: status 502 + `{ error: 'A integração do Notion não tem acesso a este banco' }`.
  - `?refresh=1` ignora e substitui o cache daquela rota.

- [ ] **Step 1: Write failing tests** (`tests/app.test.js`): sobe `createApp(...).listen(0)` e usa `fetch`. Casos:
  - `treinos retorna objetos normalizados`: `results[0]` tem exatamente as chaves `id,nome,data,duracaoMin,modalidade,tipo,intensidade,foco`
  - `graduacoes vem ordenada por data`: com entradas em ordem `2026-03-13, 2025-08-04` → resposta `['2025-08-04','2026-03-13']`
  - `segunda chamada usa cache`: `queryDatabase` chamado 1 vez em 2 requests
  - `refresh=1 ignora cache`: 2 chamadas
  - `sem graduacoesDbId retorna fallback`: `{fallback:true}`, status 200
  - `erro não vaza detalhes`: `queryDatabase` rejeita `new Error('segredo')` → status 500, corpo `deepStrictEqual` `{ error: 'Erro ao buscar dados do Notion' }`
  - `404 do Notion vira mensagem de acesso`: rejeita `{status:404}` → 502 com a mensagem de acesso
- [ ] **Step 2: Run** `npm test` → Expected: FAIL
- [ ] **Step 3: Implement** `lib/notion.js`, `lib/app.js` (`express.static(path.join(__dirname,'..','public'))`) e o novo `server.js`, que mantém `app.listen(PORT)` como hoje (é o que já funciona na Vercel) e também faz `module.exports = app`.
- [ ] **Step 4: Run** `npm test` → Expected: PASS
- [ ] **Step 5: Verificar acesso real ao banco de graduações**: adicionar `NOTION_GRADUACOES_DB_ID=f3ad096e-f617-46a5-859f-41a6a165102e` ao `.env` local (não versionado), `npm run dev`, depois `curl http://localhost:3000/api/graduacoes`. Expected: 4 resultados, o primeiro `"titulo":"Início - Faixa Branca"`. Se vier 502 (sem acesso), **parar e avisar o usuário** para conectar a integração ao banco no Notion. Se `databases.query` falhar por causa do SDK, registrar e avisar antes de atualizar o SDK.
- [ ] **Step 6: Commit** `refactor: API normalizada com cache, erros limpos e rota de graduacoes`

> Até a Task 3, o front antigo quebra por esperar o JSON bruto. As Tasks 2 e 3 devem ser entregues juntas no mesmo push.

---

### Task 3: Cálculos de Treinos extraídos + front modular (sem regressão)

**Files:**
- Create: `public/js/package.json`, `public/js/dom.js`, `public/js/calc-treinos.js`, `public/js/api.js`, `public/js/treinos-ui.js`, `public/js/main.js`, `tests/dom.test.mjs`, `tests/calc-treinos.test.mjs`
- Modify: `public/index.html` (trocar `<script src="main.js">` por `<script type="module" src="js/main.js">`; fixar o Chart.js em `chart.js@4.4.1`)
- Delete: `public/main.js`

**Interfaces:**
- Consumes: formato `Treino` da Task 2
- Produces:
  - `escapeHtml(str) -> string` (escapa `& < > " '`; `null`/`undefined` → `''`)
  - `filterTreinos(treinos, { year, month, modality }) -> Treino[]`, mesma semântica do `applyFilters` atual (`'Todos'` = sem filtro; mês sem data é excluído)
  - `goalYearTreinos(treinos, yearFilter, now: Date) -> { targetYear, list }` (`'Todos'` → ano corrente)
  - `computeGoal(count, targetYear, now: Date, goal = 130) -> { percent, ringFraction, paceDiff, projection: number|null, projFraction: number|null, weeklyRequired: number|null, goalReached }`, mesma matemática de `updateAnnualGoalUI`
  - `computeKpis(treinos) -> { total, avgMinutes, hours: string, highIntensity, gi, nogi, monthCounts: number[12], donut: [tec, spa, sem] }` (`spa` soma `'Sparring'` e `'Sparring / Rolagem'`; `nogi` aceita `'No-Gi'` e `'No Gi'`)
  - `fetchTreinos(refresh: boolean)`, `fetchGraduacoes(refresh: boolean) -> Promise<json>`; `refresh` adiciona `?refresh=1`
  - `initTreinosUI()`, `renderTreinos(treinos)` (lê os filtros do DOM e aplica tudo), `setSyncStatus(kind: 'ok'|'demo'|'error', text)`

- [ ] **Step 1: Write failing tests**
  - `escapeHtml('<b>"A&B"</b>\'')` === `'&lt;b&gt;&quot;A&amp;B&quot;&lt;/b&gt;&#39;'`
  - `computeGoal(65, 2026, new Date(2026, 6, 2), 130)`: `percent === 50`, `projection` é aprox. `65 / 182 * 365` (dias passados = `floor((now - 1º jan)/dia)` = 182), `weeklyRequired` aprox. `65 / ((365-182)/7)`
  - `computeGoal(10, 2025, new Date(2026,0,10))` (ano passado): `weeklyRequired === null`, `goalReached === false`, `projection === 10`
  - `computeGoal(140, ...)`: `goalReached === true`, `ringFraction` aprox. `140/130`
  - `computeKpis` com 3 treinos (60 min Gi Alta Técnica 2026-01-05; 90 min 'No Gi' Sparring / Rolagem 2026-02-01; 30 min sem data): `total 3`, `avgMinutes 60`, `hours '3.0'`, `highIntensity 1`, `gi 1`, `nogi 1`, `monthCounts[0]===1 && monthCounts[1]===1`, `donut` `[1,1,0]`
  - `filterTreinos` com `{year:'2026', month:'02', modality:'Todos'}` retorna só o de fevereiro
  - `goalYearTreinos(treinos,'Todos', new Date(2026,5,1)).targetYear === 2026`
- [ ] **Step 2: Run** `npm test` → Expected: FAIL
- [ ] **Step 3: Implement** os módulos. `treinos-ui.js` reproduz o DOM atual (mesmos ids, mesmas classes, mesmo empty state, mesmos textos 🟢/🔴/🟡, "Meta atingida! 🏆"), usando `escapeHtml` em `nome`, `foco`, `modalidade`, `tipo` e `intensidade`. As pills continuam alternando `active` **e** `aria-pressed`.
- [ ] **Step 4: Run** `npm test` → Expected: PASS
- [ ] **Step 5: Paridade manual**: `npm run dev` e comparar a tela com `paridade-baseline.md` (Task 1, Step 0). Os valores precisam ser idênticos (com folga só se um treino novo tiver entrado no Notion nesse meio-tempo) e o console sem erros.
- [ ] **Step 6: Commit** `refactor: front em modulos ES com calculos testados e escape de HTML`

---

### Task 4: Cálculos da linha do tempo de graduações

**Files:**
- Create: `public/js/calc-graduacoes.js`, `tests/calc-graduacoes.test.mjs`

**Interfaces:**
- Consumes: `Treino`, `Graduacao`
- Produces:
  - `calendarDiff(fromISO, toISO) -> { years, months, days }` (calendário real: avança meses inteiros e conta o resto em dias; se o dia de origem não existe no mês de destino, usa o último dia do mês)
  - `formatDuration({years, months, days}) -> string`: as duas maiores unidades não-zero, com singular/plural PT-BR e "e" entre elas (`'1 ano e 2 meses'`, `'3 meses e 27 dias'`, `'1 dia'`); tudo zero → `'hoje'`
  - `validGraduacoes(list) -> Graduacao[]`: descarta itens sem `data` ou sem `faixa` e ordena por data
  - `buildTimeline(graduacoes, treinos: Treino[]|null, todayISO) -> Array<{ marco: Graduacao, intervalo: { inicio, fim, emAndamento: boolean, duracao: {years,months,days}, treinos: number|null, horas: string|null } }>`. Intervalo `i`: `[marco_i.data, marco_{i+1}.data)`; no último, `[marco.data, todayISO]` inclusive, com `emAndamento: true`. `treinos === null` → `treinos`/`horas` null. Horas = `(soma duracaoMin / 60).toFixed(1)`. Treinos sem data ficam fora.
  - `journeySummary(graduacoes, treinos|null, todayISO) -> { faixa, grau, faixaDesde, tempoNaFaixa, tempoTotal, totalTreinos: number|null, horas: string|null } | null`. `faixaDesde` = data do marco **mais antigo** cuja `faixa` é igual à do último marco; `tempoTotal` desde o primeiro marco; contagens desde o primeiro marco até hoje inclusive; `null` se a lista válida estiver vazia.

- [ ] **Step 1: Write failing tests** (dados reais como fixture: Início 2025-08-04 Branca, 1º Grau 2025-12-01, 2º Grau 2026-03-13, Azul 2026-10-18)
  - `calendarDiff('2025-08-04','2025-12-01')` → `{0,3,27}`; `('2025-12-01','2026-03-13')` → `{0,3,12}`; `('2026-01-31','2026-02-28')` → `{0,0,28}`; `('2024-02-29','2025-02-28')` sem negativos/NaN
  - `formatDuration({years:0,months:3,days:27})==='3 meses e 27 dias'`; `{1,2,5}`→`'1 ano e 2 meses'`; `{0,0,1}`→`'1 dia'`; `{0,0,0}`→`'hoje'`
  - `buildTimeline`: com treinos em `2025-12-01` (60 min) e `2025-11-30` (90 min) → o intervalo 0 conta só o de 11-30 (`treinos 1`, `horas '1.5'`) e o intervalo 1 conta o de 12-01
  - último intervalo com `todayISO='2026-10-19'` e um treino em `2026-10-19` → `emAndamento true`, `treinos 1`
  - `buildTimeline(grads, null, ...)` → `treinos === null && horas === null`
  - `journeySummary` com fixture + marco extra `1º Grau` Azul em `2027-03-01`, `todayISO '2027-03-03'` → `faixa 'Azul'`, `grau '1º Grau'`, `faixaDesde '2026-10-18'`
  - `validGraduacoes` descarta um item sem `data` e um sem `faixa`; `journeySummary([],...)===null`
- [ ] **Step 2: Run** `npm test` → FAIL
- [ ] **Step 3: Implement** `public/js/calc-graduacoes.js` (puro, sem DOM, sem `Date` para string ISO fora de `T00:00:00` local)
- [ ] **Step 4: Run** `npm test` → PASS
- [ ] **Step 5: Commit** `feat: calculos da linha do tempo de graduacoes`

---

### Task 5: Abas e UI da linha do tempo

**Files:**
- Create: `public/js/graduacoes-ui.js`
- Modify: `public/index.html` (tablist no header; envolver os blocos atuais em `<section id="panel-treinos" role="tabpanel">`; adicionar `<section id="panel-graduacoes" role="tabpanel" hidden>`), `public/index.css` (estilos de abas, destaque, timeline e faixa), `public/js/main.js`

**Interfaces:**
- Consumes: `fetchGraduacoes`, `buildTimeline`, `journeySummary`, `validGraduacoes`, `formatDuration`, `escapeHtml`
- Produces: `renderGraduacoes(state: { status: 'loading'|'ok'|'empty'|'error', graduacoes, treinos: Treino[]|null, message }, todayISO)`; `main.js` controla `activateTab(name: 'treinos'|'graduacoes')`, sincronizado com `location.hash` (`#graduacoes`; qualquer outro valor → treinos)

- [ ] **Step 1: Abas**: `role="tablist"` com dois `role="tab"` (`aria-selected`, `aria-controls`, setas ←/→ alternam). A barra de filtros fica dentro do painel Treinos (oculta na outra aba). `hashchange` e carga inicial chamam `activateTab`.
- [ ] **Step 2: Carregamento**: `main.js` busca treinos e graduações em paralelo (`Promise.allSettled`). O LED/status reflete **só** os treinos (como hoje). As graduações recebem `treinos = null` se o fetch de treinos falhar ou vier `fallback`. "Atualizar" refaz os dois com `refresh=true`.
- [ ] **Step 3: Destaque**: desenho da faixa (componente CSS: barra na cor da faixa + ponteira preta com N listras brancas; na Preta, ponteira vermelha; a Branca recebe borda), `Faixa {faixa} · {grau}`, `na faixa há {formatDuration(tempoNaFaixa)}` (`'hoje'` → "desde hoje"), `jornada de {tempoTotal}`, e `{totalTreinos} treinos · {horas} h` (omitido se null).
- [ ] **Step 4: Linha do tempo**: lista `<ol>` vertical, do mais antigo para o mais recente. Cada marco mostra a data `dd/mm/aaaa`, o título, a faixa desenhada, o professor, a academia e as observações (só se não vazias), tudo escapado. Entre os marcos, um conector com `duracao`, `N treinos` e `X h`; no último, o rótulo "em andamento". Se `treinos === null`, um aviso discreto "Contagem de treinos indisponível". Estados: loading, empty ("Nenhuma graduação cadastrada no Notion"), error (a mensagem do servidor). Animação de entrada sutil, desligada em `prefers-reduced-motion`.
- [ ] **Step 5: Verificar no navegador** (`npm run dev`, preview): a aba Graduações mostra 4 marcos; os intervalos 1 e 2 dizem "3 meses e 27 dias" e "3 meses e 12 dias"; o destaque mostra "Faixa Azul · Sem grau"; `#graduacoes` abre direto na aba; larguras 320/768/1440 sem scroll horizontal; a aba Treinos continua idêntica; console sem erros.
- [ ] **Step 6: Run** `npm test` → PASS
- [ ] **Step 7: Commit** `feat: aba Graduacoes com linha do tempo e treinos entre marcos`

---

### Task 6: Documentação e verificação final

**Files:**
- Modify: `README.md` (nova env, aba Graduações, `npm test`, entrada no histórico de 2026-10-19)

- [ ] **Step 1:** Atualizar o README.
- [ ] **Step 2: Falha cruzada manual**: com `NOTION_GRADUACOES_DB_ID` vazio, a aba Treinos funciona e o LED fica verde; a aba Graduações mostra o fallback. Restaurar a env depois.
- [ ] **Step 3:** `npm test` → todos PASS.
- [ ] **Step 4: Commit** `docs: README com aba Graduacoes e nova variavel`
- [ ] **Step 5: Avisar o usuário** para cadastrar `NOTION_GRADUACOES_DB_ID` nas variáveis de ambiente do projeto na Vercel antes do push/deploy. Não fazer push sem a confirmação dele.
