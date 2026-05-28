# Redesign Visual "Arena" do Jiu-Jitsu Tracker — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestilizar completamente a camada visual do dashboard com a identidade esportiva vibrante "Arena" (base escura, acento elétrico frio, tipografia condensada), reorganizar o layout e introduzir um Hero de Meta com anel radial SVG — sem alterar a aquisição de dados do Notion.

**Architecture:** O dashboard é 100% client-side. As mudanças ocorrem em `public/index.css` (reescrita completa), `public/index.html` (reorganização de layout + hero SVG + fonte) e `public/main.js` (apenas render: troca do gauge Chart.js por anel SVG e re-tema dos gráficos). `server.js` e todo o *parsing* de propriedades do Notion em `main.js` permanecem intactos.

**Tech Stack:** HTML5, CSS3, JavaScript (ES6+), Chart.js (CDN), Google Fonts (Inter + Oswald), SVG.

---

## Notas de Metodologia

- **Sem framework de testes:** o projeto não possui test runner. A verificação de cada tarefa é **manual no navegador** (`npm run dev` → `http://localhost:3000`), conforme o plano de verificação do spec.
- **NÃO ALTERAR:** `server.js` e o *parsing* de dados em `main.js` (leitura de `page.properties[...]`, `fetchTreinos`, `applyFilters` e os cálculos de meta/ritmo/projeção). Só muda como os valores são exibidos.
- **Estado inicial conhecido:** o `index.css` atual está quebrado (referencia variáveis inexistentes da tentativa anterior). A Task 1 reescreve a base do CSS; ao longo do plano o arquivo é totalmente substituído.

### Mapeamento de Arquivos

| Arquivo | Responsabilidade no redesign |
|---------|------------------------------|
| `public/index.css` | Reescrita completa: tokens, base, layout, header/filtros, hero, KPIs, gráficos, tabela, estados, responsivo, reduced-motion. |
| `public/index.html` | Link da fonte Oswald; LED de sync no header; substituição da `goals-grid` pelo Hero com SVG; pequenos ajustes de classes. |
| `public/main.js` | Remover `gaugeChart`; anel SVG em `updateAnnualGoalUI`; re-tema de `barChart`/`donutChart` em `initCharts`; estado vazio estilizado. **Parsing/fetch inalterados.** |
| `server.js` | Sem alterações. |

---

### Task 1: Fundação de CSS — Tokens, Fontes e Base

**Files:**
- Modify: `public/index.html:7-12` (adicionar fonte Oswald)
- Modify: `public/index.css:1-69` (reescrever `:root`, base, scrollbar, container, `.card`, utilitários de texto)

- [ ] **Step 1: Adicionar a fonte Oswald no `<head>` do HTML**

Substituir a linha do `<link>` da fonte Inter (linha 10) por ambas as fontes:

```html
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Reescrever o topo do `index.css` (tokens + base)**

Substituir o conteúdo das linhas 1–69 atuais (de `:root {` até o fim do bloco `.card { ... }`) por:

```css
:root {
    /* Base escura */
    --bg: #0A0B0F;
    --bg-elev: #13151B;
    --bg-elev-2: #1A1D26;
    --border: #23262F;

    /* Acento elétrico frio */
    --blue: #2E8BFF;
    --violet: #7C5CFF;
    --teal: #19E3C2;

    /* Semânticas */
    --warn: #FFB020;
    --danger: #FF4D5E;

    /* Texto */
    --text: #EDEFF4;
    --text-muted: #8A93A6;
    --text-dim: #5A6172;

    /* Tipografia */
    --font-body: 'Inter', sans-serif;
    --font-display: 'Oswald', 'Inter', sans-serif;

    /* Forma */
    --radius: 16px;
    --radius-sm: 10px;
    --radius-pill: 9999px;

    /* Sombra */
    --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.35);
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    background-color: var(--bg);
    color: var(--text);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
}

/* Scrollbar customizada */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

.app-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 28px 24px;
}

/* Títulos de seção */
h3 {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 16px;
}
h4 { font-size: 12px; font-weight: 600; color: var(--text-muted); }
h5 {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
}

/* Utilitários de cor de texto */
.text-blue { color: var(--blue) !important; }
.text-violet { color: var(--violet) !important; }
.text-teal { color: var(--teal) !important; }
.text-warn { color: var(--warn) !important; }
.text-danger { color: var(--danger) !important; }

/* Card genérico */
.card {
    background-color: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    box-shadow: var(--shadow-card);
}
```

- [ ] **Step 3: Iniciar o servidor e verificar a base no navegador**

Run: `npm run dev`
Expected: terminal mostra `🚀 Server is running on http://localhost:3000`. Abrir `http://localhost:3000` — o fundo agora é quase-preto azulado, o texto claro, e os cards voltam a ter fundo/borda visíveis (o CSS quebrado foi resolvido). O layout interno ainda estará "tosco" (próximas tasks ajustam), mas nada deve estar invisível.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/index.css
git commit -m "style: estabelecer tokens, fontes e base da identidade Arena"
```

---

### Task 2: Header com LED de Sync e Barra de Filtros

**Files:**
- Modify: `public/index.html:16-70` (header + filtros)
- Modify: `public/index.css` (adicionar estilos de header, LED, filtros, pills)
- Modify: `public/main.js:312-325` (atualizar classe do LED em `fetchTreinos`)

- [ ] **Step 1: Reescrever o header no HTML**

Substituir o bloco `<header class="top-header"> ... </header>` (linhas 16–25) por:

```html
        <header class="top-header">
            <div class="header-left">
                <span class="icon">🥋</span>
                <h1>Jiu-Jitsu <span class="accent-text">Arena</span></h1>
            </div>
            <div class="header-right">
                <div class="status-indicator">
                    <span id="sync-led" class="led-dot led-teal"></span>
                    <span id="sync-status">Aguardando sincronização...</span>
                </div>
                <button id="refresh-btn" class="header-btn">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>
                    Atualizar
                </button>
            </div>
        </header>
```

- [ ] **Step 2: Remover o antigo `status-indicator` de dentro do card de filtros**

No HTML, dentro de `<section class="filters-card">`, remover o bloco (linhas 67–69):

```html
            <div class="status-indicator">
                <span id="sync-status">⏳ Aguardando sincronização...</span>
            </div>
```

(O status agora vive no header. Os três `filter-group` permanecem.)

- [ ] **Step 3: Adicionar estilos de header, LED e filtros no CSS**

Acrescentar ao `index.css` (após o bloco `.card`):

```css
/* Header */
.top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 28px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--border);
}
.header-left { display: flex; align-items: center; gap: 12px; }
.icon { font-size: 26px; }
h1 { font-family: var(--font-display); font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
.accent-text {
    background: linear-gradient(135deg, var(--blue), var(--teal));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}
.header-right { display: flex; align-items: center; gap: 18px; }
.status-indicator { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); }
.led-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; transition: all 0.3s ease; }
.led-teal { background-color: var(--teal); box-shadow: 0 0 8px var(--teal); }
.led-red { background-color: var(--danger); box-shadow: 0 0 8px var(--danger); animation: blink 1s infinite alternate; }
@keyframes blink { 0% { opacity: 0.3; } 100% { opacity: 1; } }
.header-btn {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.header-btn:hover { border-color: var(--blue); box-shadow: 0 0 12px rgba(46, 139, 255, 0.25); }
.header-btn:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }

/* Filtros */
.filters-card {
    background-color: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 24px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.filter-group { display: flex; align-items: center; gap: 16px; }
.filter-label {
    min-width: 96px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-muted);
}
.pills-container { display: flex; flex-wrap: wrap; gap: 8px; }
.pill {
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-radius: var(--radius-pill);
    padding: 6px 14px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}
.pill:hover { border-color: var(--text-muted); color: var(--text); }
.pill:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
.pill.active {
    background: linear-gradient(135deg, var(--blue), var(--violet));
    color: #fff;
    border-color: transparent;
    font-weight: 600;
    box-shadow: 0 0 12px rgba(46, 139, 255, 0.35);
}
```

- [ ] **Step 4: Atualizar o LED em `fetchTreinos` (`public/main.js`)**

Substituir a função `fetchTreinos` (linhas 307–326) por esta versão, que manipula a classe do LED. **O fetch e o parsing permanecem idênticos** — só foram adicionadas as linhas do LED:

```javascript
async function fetchTreinos() {
    const led = document.getElementById('sync-led');
    const statusText = document.getElementById('sync-status');
    if (led) led.className = 'led-dot led-teal';

    try {
        const resp = await fetch('/api/treinos');
        const data = await resp.json();

        if (data.fallback) {
            if (statusText) statusText.innerText = `⚠️ Modo Demonstração (Verifique .env)`;
            if (led) led.className = 'led-dot led-red';
            return;
        }

        if (data.results) {
            if (statusText) statusText.innerText = `✅ ${data.results.length} treinos carregados do Notion`;
            globalResults = data.results;
            applyFilters();
        }
    } catch (e) {
        console.error("Error fetching treinos:", e);
        if (statusText) statusText.innerText = `❌ Falha ao carregar dados do proxy local.`;
        if (led) led.className = 'led-dot led-red';
    }
}
```

- [ ] **Step 5: Verificar no navegador**

Recarregar `http://localhost:3000`. O header deve mostrar o título com gradiente azul→verde-água, o LED (teal se conectado / vermelho piscante em modo demo) e o botão Atualizar com hover azul. Os filtros devem ter pills com gradiente quando ativas. Clicar nas pills ainda deve filtrar normalmente.

- [ ] **Step 6: Commit**

```bash
git add public/index.html public/index.css public/main.js
git commit -m "feat: reestilizar header com LED de sync e barra de filtros Arena"
```

---

### Task 3: Hero de Meta — Estrutura HTML (anel SVG) e CSS

**Files:**
- Modify: `public/index.html:73-111` (substituir `goals-grid` pelo Hero)
- Modify: `public/index.css` (adicionar estilos do hero, anel e blocos de ritmo)

- [ ] **Step 1: Substituir a `<section class="goals-grid">` inteira pelo Hero**

Substituir o bloco das linhas 73–111 (de `<!-- Goal Grid -->` até o fechamento `</section>` da `goals-grid`) por:

```html
        <!-- Hero de Meta -->
        <section class="card hero-goal">
            <div class="hero-ring-side">
                <span class="hero-label">META <span id="goal-year">ANUAL</span></span>
                <div class="ring-wrapper">
                    <svg class="activity-ring" width="220" height="220" viewBox="0 0 220 220">
                        <defs>
                            <linearGradient id="grad-hero" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#2E8BFF" />
                                <stop offset="100%" stop-color="#19E3C2" />
                            </linearGradient>
                        </defs>
                        <circle class="ring-bg" cx="110" cy="110" r="90" fill="none" stroke="#23262F" stroke-width="18" />
                        <circle id="ring-progress" class="ring-fill" cx="110" cy="110" r="90" fill="none"
                                stroke="url(#grad-hero)" stroke-width="18" stroke-linecap="round"
                                stroke-dasharray="565.48" stroke-dashoffset="565.48" transform="rotate(-90 110 110)" />
                        <circle id="ring-progress-extra" class="ring-fill" cx="110" cy="110" r="90" fill="none"
                                stroke="#7C5CFF" stroke-width="18" stroke-linecap="round"
                                stroke-dasharray="565.48" stroke-dashoffset="565.48" transform="rotate(-90 110 110)"
                                style="display: none;" />
                    </svg>
                    <div class="ring-center">
                        <span id="goal-percent" class="ring-percent">0%</span>
                        <span id="goal-text" class="ring-sub">0 / 130</span>
                    </div>
                </div>
            </div>

            <div class="hero-stats">
                <div class="stat-block">
                    <div class="stat-icon" id="pace-icon">🟡</div>
                    <div class="stat-body">
                        <h4>Status do Ritmo</h4>
                        <span id="pace-status">-- treinos</span>
                    </div>
                </div>
                <div class="stat-block">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-body">
                        <h4>Projeção Anual</h4>
                        <span id="projection">-- treinos</span>
                        <div class="proj-bar-container"><div class="proj-bar-fill" id="proj-bar"></div></div>
                    </div>
                </div>
                <div class="stat-block">
                    <div class="stat-icon">📅</div>
                    <div class="stat-body">
                        <h4>Para Bater a Meta</h4>
                        <span id="weekly-req">-- treinos/semana</span>
                    </div>
                </div>
            </div>
        </section>
```

- [ ] **Step 2: Adicionar estilos do Hero no CSS**

Acrescentar ao `index.css`:

```css
/* Hero de Meta */
.hero-goal {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 32px;
    align-items: center;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
}
.hero-goal::before {
    content: '';
    position: absolute;
    top: -40%;
    left: -10%;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(46, 139, 255, 0.10), transparent 70%);
    pointer-events: none;
}
.hero-ring-side { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.hero-label {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
}
.ring-wrapper { position: relative; width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; }
.ring-fill { transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
.ring-center { position: absolute; display: flex; flex-direction: column; align-items: center; }
.ring-percent { font-family: var(--font-display); font-size: 52px; font-weight: 700; line-height: 1; color: var(--text); }
.ring-sub { font-family: var(--font-display); font-size: 15px; font-weight: 500; color: var(--text-muted); margin-top: 4px; letter-spacing: 1px; }

.hero-stats { display: flex; flex-direction: column; gap: 12px; }
.stat-block {
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: var(--bg-elev-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 16px;
}
.stat-icon { font-size: 20px; background: rgba(255, 255, 255, 0.03); padding: 10px; border-radius: 10px; line-height: 1; }
.stat-body { flex: 1; }
.stat-body h4 { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px; }
.stat-body span { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--text); }
.proj-bar-container { width: 100%; height: 5px; background-color: var(--border); border-radius: 99px; margin-top: 8px; overflow: hidden; }
.proj-bar-fill { height: 100%; width: 0%; background: linear-gradient(90deg, var(--blue), var(--teal)); border-radius: 99px; transition: width 0.5s ease, background 0.3s ease; }
```

- [ ] **Step 3: Verificar no navegador (estrutura)**

Recarregar a página. O Hero deve aparecer com o anel SVG (trilha cinza + traço gradiente azul→verde-água) à esquerda e os 3 blocos de ritmo à direita. Neste ponto o anel ainda mostra `0%` fixo (a lógica vem na Task 4) — não deve haver erro no console relacionado ao gauge. Se houver erro `Cannot read properties of null (reading 'getContext')` referente a `gauge-chart`, isso será corrigido na Task 4 (Step 1 remove o gaugeChart).

> Nota: até a Task 4 ser aplicada, o `main.js` ainda tenta criar o `gaugeChart` apontando para um `<canvas id="gauge-chart">` que acabou de ser removido. Aplique a Task 4 em seguida para eliminar o erro de console. Se quiser validar isoladamente agora, comente temporariamente o bloco do `gaugeChart` em `initCharts`.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/index.css
git commit -m "feat: adicionar Hero de Meta com anel radial SVG e blocos de ritmo"
```

---

### Task 4: Lógica do Anel SVG no `main.js`

**Files:**
- Modify: `public/main.js:1-2` (remover `gaugeChart` do escopo)
- Modify: `public/main.js:20-44` (remover criação do `gaugeChart` em `initCharts`)
- Modify: `public/main.js:144-158` (anel SVG em `updateAnnualGoalUI`)
- Modify: `public/main.js` (definir ano do hero)

- [ ] **Step 1: Remover `gaugeChart` da declaração de escopo (linha 2)**

Trocar:

```javascript
let gaugeChart, barChart, donutChart;
```

por:

```javascript
let barChart, donutChart;
```

- [ ] **Step 2: Remover a criação do `gaugeChart` em `initCharts`**

Remover o bloco que cria o gauge (linhas 25–44, de `const ctxGauge = ...` até o fechamento `});` do `gaugeChart`). A função `initCharts` deve começar direto na configuração de defaults seguida pelo `barChart`:

```javascript
function initCharts() {
    Chart.defaults.color = '#8A93A6';
    Chart.defaults.borderColor = '#23262F';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // (barChart e donutChart permanecem — re-tematizados na Task 6)
    const ctxBar = document.getElementById('bar-chart').getContext('2d');
    // ... resto inalterado nesta task
```

- [ ] **Step 3: Substituir o trecho do gauge em `updateAnnualGoalUI` pelo controle do anel SVG**

Na função `updateAnnualGoalUI`, substituir as linhas que manipulavam o gauge (linhas 148–158: do `let fraction = ...` / `let gaugeColor = ...` até o `document.getElementById('goal-text').innerText = ...`) por:

```javascript
    const percent = Math.round((currentTotal / goal) * 100);
    document.getElementById('goal-percent').innerText = `${percent}%`;
    document.getElementById('goal-text').innerText = `${currentTotal} / ${goal}`;

    const yearEl = document.getElementById('goal-year');
    if (yearEl) yearEl.innerText = String(targetYear);

    // Anel SVG: circunferência de r=90 → 2π·90 ≈ 565.48
    const CIRC = 565.48;
    const ringFill = document.getElementById('ring-progress');
    const ringExtra = document.getElementById('ring-progress-extra');
    const fraction = currentTotal / goal;

    if (ringFill) {
        if (fraction <= 1) {
            ringFill.style.strokeDashoffset = CIRC - (fraction * CIRC);
            if (ringExtra) ringExtra.style.display = 'none';
        } else {
            ringFill.style.strokeDashoffset = 0;
            if (ringExtra) {
                ringExtra.style.display = 'block';
                const extra = Math.min(1, fraction - 1);
                ringExtra.style.strokeDashoffset = CIRC - (extra * CIRC);
            }
        }
    }
```

> O restante de `updateAnnualGoalUI` (cálculo de `daysPassed`, `paceDiff`, `pace-status`/`pace-icon`, `projection`/`proj-bar`, `weekly-req`) permanece **exatamente como está**. As cores `var(--alert)`/`var(--success)`/`var(--primary)`/`var(--warn)` usadas no `proj-bar` serão ajustadas na Task 6, Step 4.

- [ ] **Step 4: Verificar no navegador (lógica do anel)**

Recarregar a página. Sem erros no console. O anel deve preencher proporcionalmente ao total de treinos do ano filtrado, o `%` e `X / 130` no centro devem bater, e o label deve mostrar o ano (ex.: `META 2026`). Trocar o filtro de Ano deve reanimar o anel.

- [ ] **Step 5: Validar o overflow > 100% (manual)**

Temporariamente, no topo de `updateAnnualGoalUI`, forçar `const currentTotal = 140;` (acima de 130). Recarregar: o anel principal deve preencher 100% e o círculo violeta extra deve desenhar a volta adicional. **Reverter** para `const currentTotal = results.length;` depois.

- [ ] **Step 6: Commit**

```bash
git add public/main.js
git commit -m "feat: substituir gauge Chart.js por anel radial SVG animado"
```

---

### Task 5: Grid de KPIs Esportivos

**Files:**
- Modify: `public/index.html:114-139` (classes de cor dos KPIs)
- Modify: `public/index.css` (estilos do grid de KPIs e hover)

- [ ] **Step 1: Ajustar as classes de cor dos valores de KPI no HTML**

Na `<section class="metrics-grid">`, atualizar as classes `text-*` dos `kpi-value` para a nova paleta:

```html
        <section class="metrics-grid">
            <div class="kpi-card">
                <h5>TOTAL DE TREINOS</h5>
                <div class="kpi-value text-blue" id="kpi-total">0</div>
            </div>
            <div class="kpi-card">
                <h5>DURAÇÃO MÉDIA</h5>
                <div class="kpi-value text-teal" id="kpi-avg-duration">0 <span class="kpi-unit">min</span></div>
            </div>
            <div class="kpi-card">
                <h5>HORAS TOTAIS</h5>
                <div class="kpi-value text-teal" id="kpi-hours">0</div>
            </div>
            <div class="kpi-card">
                <h5>ALTA INTENSIDADE</h5>
                <div class="kpi-value text-danger" id="kpi-high-intensity">0</div>
            </div>
            <div class="kpi-card">
                <h5>TREINOS GI</h5>
                <div class="kpi-value text-blue" id="kpi-gi">0</div>
            </div>
            <div class="kpi-card">
                <h5>TREINOS NO-GI</h5>
                <div class="kpi-value text-danger" id="kpi-nogi">0</div>
            </div>
        </section>
```

- [ ] **Step 2: Substituir os estilos `.metrics-grid`, `.kpi-card`, `.kpi-value`, `.kpi-unit` no CSS**

Localizar os estilos antigos `.metrics-grid` e `.kpi-card` (linhas ~209–225 do arquivo original) e substituí-los por:

```css
.metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}
.kpi-card {
    background-color: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.kpi-card:hover {
    transform: translateY(-2px);
    border-color: rgba(46, 139, 255, 0.4);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}
.kpi-value {
    font-family: var(--font-display);
    font-size: 34px;
    font-weight: 700;
    line-height: 1;
}
.kpi-unit { font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--text-muted); }
```

- [ ] **Step 3: Verificar no navegador**

Recarregar. Os 6 KPIs devem mostrar números grandes em Oswald, coloridos conforme a métrica, em grid de 3 colunas, com elevação e borda azul no hover.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/index.css
git commit -m "feat: reestilizar grid de KPIs com tipografia condensada e hover"
```

---

### Task 6: Re-tema dos Gráficos Chart.js e cores da barra de projeção

**Files:**
- Modify: `public/index.css` (`.charts-row`, `.canvas-wrapper`)
- Modify: `public/main.js` (`initCharts`: cores de `barChart` e `donutChart`)
- Modify: `public/main.js` (cores da `proj-bar` em `updateAnnualGoalUI`)

- [ ] **Step 1: Atualizar estilos de `.charts-row` e `.canvas-wrapper` no CSS**

Substituir o bloco `.charts-row` / `.canvas-wrapper` (linhas ~227–233 do original) por:

```css
.charts-row {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
}
.canvas-wrapper { position: relative; height: 240px; width: 100%; }
```

- [ ] **Step 2: Re-tematizar o `barChart` em `initCharts` (gradiente azul + cantos arredondados)**

Substituir a criação do `barChart` (bloco `const ctxBar = ...` até seu `});`) por:

```javascript
    const ctxBar = document.getElementById('bar-chart').getContext('2d');
    const gradientBar = ctxBar.createLinearGradient(0, 0, 0, 240);
    gradientBar.addColorStop(0, '#2E8BFF');
    gradientBar.addColorStop(1, 'rgba(46, 139, 255, 0.10)');
    barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
            datasets: [{
                label: 'Treinos',
                data: [0,0,0,0,0,0,0,0,0,0,0,0],
                backgroundColor: gradientBar,
                borderRadius: 6,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#23262F' } },
                x: { grid: { display: false } }
            }
        }
    });
```

- [ ] **Step 3: Re-tematizar o `donutChart` em `initCharts` (cores Arena)**

Substituir a criação do `donutChart` (bloco `const ctxDonut = ...` até seu `});`) por:

```javascript
    const ctxDonut = document.getElementById('donut-chart').getContext('2d');
    donutChart = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: ['Técnica', 'Sparring', 'Seminário'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#2E8BFF', '#19E3C2', '#7C5CFF'],
                borderWidth: 3,
                borderColor: '#13151B'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: { position: 'right', labels: { color: '#EDEFF4', boxWidth: 12, font: { size: 12, weight: '600' } } }
            }
        }
    });
```

- [ ] **Step 4: Ajustar as cores da `proj-bar` em `updateAnnualGoalUI`**

No trecho da projeção (que define `pColor`), substituir as variáveis antigas inexistentes pelas novas. Trocar:

```javascript
        let pColor = 'var(--alert)';
        if (projFraction >= 1) pColor = 'var(--success)';
        else if (projFraction >= 0.9) pColor = 'var(--primary)';
        else if (projFraction >= 0.75) pColor = 'var(--warn)';
```

por:

```javascript
        let pColor = 'var(--danger)';
        if (projFraction >= 1) pColor = 'var(--teal)';
        else if (projFraction >= 0.9) pColor = 'var(--blue)';
        else if (projFraction >= 0.75) pColor = 'var(--warn)';
```

- [ ] **Step 5: Verificar no navegador**

Recarregar. As barras mensais devem ter gradiente azul e cantos arredondados; a rosca deve usar azul/verde-água/violeta com legenda clara à direita; a mini-barra de projeção deve colorir conforme o ritmo (verde-água quando projeção ≥ meta).

- [ ] **Step 6: Commit**

```bash
git add public/index.css public/main.js
git commit -m "feat: re-tematizar graficos Chart.js e barra de projecao na paleta Arena"
```

---

### Task 7: Tabela de Atividades, Tags e Estado Vazio

**Files:**
- Modify: `public/index.css` (`.table-section`, `table`, `th`, `td`, `.tag-*`)
- Modify: `public/main.js:267-270` (classes de tag/intensidade)
- Modify: `public/main.js:239-240` (estado vazio estilizado)

- [ ] **Step 1: Substituir estilos da tabela e tags no CSS**

Substituir o bloco da tabela (linhas ~235–255 do original: `.table-section`, `table`, `th`, `td`, `tr:hover`, `.tag-pill`, `.tag-*`) por:

```css
.table-section { background-color: var(--bg-elev); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
.table-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.table-responsive { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th {
    text-align: left;
    color: var(--text-muted);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
}
td { padding: 14px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; color: var(--text); }
tr:last-child td { border-bottom: none; }
tr { transition: background-color 0.2s ease; }
tbody tr:hover { background-color: var(--bg-elev-2); }

.tag-pill { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: var(--radius-pill); font-size: 11px; font-weight: 600; white-space: nowrap; }
.tag-blue { background-color: rgba(46, 139, 255, 0.14); color: var(--blue); }
.tag-red { background-color: rgba(255, 77, 94, 0.14); color: var(--danger); }
.tag-violet { background-color: rgba(124, 92, 255, 0.16); color: var(--violet); }
.tag-grayblue { background-color: rgba(138, 147, 166, 0.14); color: var(--text-muted); }
```

- [ ] **Step 2: Atualizar as classes de tag/intensidade em `updateFilteredUI` (`main.js`)**

Substituir as linhas 267–270:

```javascript
            let modClass = mod === 'Gi' ? 'tag-blue' : (mod ? 'tag-red' : '');
            let modIcon = mod === 'Gi' ? '🔵 Gi' : (mod ? '🔴 No-Gi' : '');
            let typeClass = type === 'Técnica' ? 'tag-purple' : (type === 'Seminário' ? 'tag-grayblue' : 'tag-grayblue');
            let intClass = int === 'Alta' ? 'text-red' : 'text-warn';
```

por:

```javascript
            let modClass = mod === 'Gi' ? 'tag-blue' : (mod ? 'tag-red' : '');
            let modIcon = mod === 'Gi' ? '🔵 Gi' : (mod ? '🔴 No-Gi' : '');
            let typeClass = type === 'Técnica' ? 'tag-violet' : 'tag-grayblue';
            let intClass = int === 'Alta' ? 'text-danger' : 'text-teal';
```

- [ ] **Step 3: Estilizar o estado vazio da tabela**

Substituir a linha 240 (o `innerHTML` do estado vazio) por:

```javascript
        document.getElementById('treinos-body').innerHTML = `
            <tr><td colspan="7" style="text-align:center; padding:48px; color: var(--text-muted);">
                <div style="font-size:28px; margin-bottom:12px;">🥋</div>
                <div>Nenhum treino registrado neste período. Hora de vestir o kimono!</div>
            </td></tr>`;
```

- [ ] **Step 4: Verificar no navegador**

Recarregar. A tabela deve ter cabeçalhos condensados em maiúsculas, hover de linha sutil, e tags translúcidas (Gi=azul, No-Gi=vermelho, Técnica=violeta). Selecionar um filtro sem resultados (ex.: um mês sem treinos) deve mostrar o estado vazio com 🥋.

- [ ] **Step 5: Commit**

```bash
git add public/index.css public/main.js
git commit -m "feat: reestilizar tabela, tags e estado vazio na identidade Arena"
```

---

### Task 8: Responsividade, Reduced-Motion e Verificação Final

**Files:**
- Modify: `public/index.css` (media queries + `prefers-reduced-motion`)

- [ ] **Step 1: Substituir a media query final do CSS pelas regras responsivas completas**

Substituir o bloco final `@media (max-width: 768px) { ... }` (linhas ~257–259 do original) por:

```css
/* Responsivo */
@media (max-width: 1023px) {
    .hero-goal { grid-template-columns: 1fr; justify-items: center; }
    .hero-stats { width: 100%; }
    .charts-row { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
    .app-container { padding: 20px 16px; }
    .filter-group { align-items: flex-start; flex-direction: column; gap: 8px; }
    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 420px) {
    .ring-wrapper, .activity-ring { width: 180px; height: 180px; }
    .ring-percent { font-size: 42px; }
}

/* Acessibilidade: movimento reduzido */
@media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
    .led-red { animation: none; }
}
```

- [ ] **Step 2: Verificação responsiva (DevTools)**

Abrir DevTools → modo responsivo. Testar larguras **375, 768, 1024, 1440 px**:
- 1440/1024: hero em 2 colunas (anel | ritmo), KPIs em 3, gráficos lado a lado.
- 768: hero empilha, KPIs em 2 colunas, filtros empilham label/pills, sem overflow horizontal.
- 375: anel reduzido legível, tabela com scroll lateral.

- [ ] **Step 3: Verificação de movimento reduzido**

Nas DevTools, emular `prefers-reduced-motion: reduce` (Rendering tab) e recarregar: o anel deve assumir o valor final sem animar e o LED vermelho não deve piscar.

- [ ] **Step 4: Verificação funcional completa (sincronia dos filtros)**

Com dados reais carregados, clicar em combinações de Ano/Mês/Modalidade e confirmar que Hero (anel + ritmo), os 6 KPIs, os 2 gráficos e a tabela atualizam juntos e coerentes. Confirmar contagens Gi/No-Gi e total batendo com a tabela.

- [ ] **Step 5: Verificação de erro/fallback (LED vermelho)**

Renomear temporariamente `NOTION_API_KEY` no `.env` para um valor inválido, reiniciar (`npm run dev`) e confirmar LED vermelho piscante + texto "Modo Demonstração". **Restaurar o `.env`** e reiniciar.

- [ ] **Step 6: Commit**

```bash
git add public/index.css
git commit -m "feat: responsividade e suporte a prefers-reduced-motion (Arena)"
```

---

## Verificação Final (checklist do spec)

- [ ] Filtros sincronizam hero + KPIs + gráficos + tabela.
- [ ] Responsivo em 375 / 768 / 1024 / 1440 sem overflow.
- [ ] Estado vazio motivacional aparece quando não há resultados.
- [ ] Anel suporta meta > 100% (volta extra violeta).
- [ ] LED vermelho piscante em fallback/erro; restaurado o `.env`.
- [ ] `prefers-reduced-motion` desliga animações.
- [ ] `server.js` e o parsing de dados do Notion permanecem inalterados.
