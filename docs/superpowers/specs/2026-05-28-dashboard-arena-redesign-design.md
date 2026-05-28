# Especificação de Design: Redesign Visual "Arena" do Jiu-Jitsu Tracker

**Data:** 28 de Maio de 2026
**Status:** Aprovado
**Autor:** Claude Code
**Substitui:** `2026-05-23-dashboard-redesign.md` (direção Cyber Neon descartada)

---

## 1. Visão Geral e Objetivos

Reformular **apenas a camada visual** do dashboard do Jiu-Jitsu Tracker, adotando uma
estética **esportiva vibrante** sobre base escura, com paleta elétrica fria e tipografia
condensada de "placar". O objetivo é tornar o painel mais motivacional e com hierarquia
clara, destacando a meta anual como peça-foco.

### Escopo

**Dentro do escopo (visual):**
- Reescrita completa de `public/index.css` com nova identidade.
- Ajustes estruturais em `public/index.html` (reorganização de layout + novo hero).
- Ajustes de **renderização** em `public/main.js`: substituição do gauge Chart.js por
  um anel radial SVG e re-tema dos gráficos Chart.js (barras e rosca).

**Fora do escopo (NÃO alterar):**
- A lógica de aquisição de dados do Notion: `server.js` e todo o *parsing* de
  propriedades em `main.js` (`Data`, `Treino`, `Duração (min)`, `Modalidade`, `Tipo`,
  `Intensidade`, `Foco do Treino`) permanecem **intactos**.
- A lógica de cálculo de meta, ritmo, projeção e treinos/semana permanece a mesma; muda
  apenas como esses valores são **exibidos**.
- Os filtros (Ano/Mês/Modalidade) e o fluxo `applyFilters → updateAnnualGoalUI +
  updateFilteredUI` permanecem com o mesmo comportamento.

### Contexto importante

A tentativa anterior (Cyber Neon) aplicou somente a "Task 1" (novos tokens no `:root`),
o que deixou o `index.css` **quebrado**: o restante do arquivo referencia variáveis que
deixaram de existir (`--surface-color`, `--border-color`, `--primary`, `--accent`,
`--success`, `--alert`, `--warn`, `--text-primary`, `--text-secondary`). A reescrita
completa do CSS prevista neste spec **resolve esse estado quebrado** como consequência
natural.

---

## 2. Identidade Visual (Design Tokens)

### 2.1 Paleta — base escura azulada

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg` | `#0A0B0F` | Plano de fundo da página |
| `--bg-elev` | `#13151B` | Superfície dos cards |
| `--bg-elev-2` | `#1A1D26` | Hover / superfície secundária |
| `--border` | `#23262F` | Bordas finas de separação |

### 2.2 Acento elétrico frio (vibrante)

| Token | Valor | Uso |
|-------|-------|-----|
| `--blue` | `#2E8BFF` | Acento primário, dados de volume |
| `--violet` | `#7C5CFF` | Acento secundário, técnica, overflow do anel |
| `--teal` | `#19E3C2` | Positivo / no ritmo / verde-água do anel |
| `--grad-hero` | `linear-gradient(135deg, #2E8BFF, #19E3C2)` | Traço do anel da meta |
| `--grad-accent` | `linear-gradient(135deg, #2E8BFF, #7C5CFF)` | Realces/botões |

### 2.3 Cores semânticas

| Token | Valor | Uso |
|-------|-------|-----|
| `--warn` | `#FFB020` | Intensidade média, atenção |
| `--danger` | `#FF4D5E` | Atrasado no ritmo, alta intensidade, erro |
| (positivo) | `--teal` | Adiantado / meta no caminho |

### 2.4 Texto

| Token | Valor | Uso |
|-------|-------|-----|
| `--text` | `#EDEFF4` | Texto principal |
| `--text-muted` | `#8A93A6` | Labels e legendas |
| `--text-dim` | `#5A6172` | Texto terciário / placeholders |

### 2.5 Forma e profundidade

- `--radius` `16px` (cards) · `--radius-sm` `10px` · `--radius-pill` `9999px`
- Sombra base de card: sombra suave escura; o **hero** recebe glow sutil do acento.

### 2.6 Tipografia

- **Corpo / labels / tabela:** `Inter` (400–700), já carregada.
- **Números e títulos (display condensado):** `Oswald` (pesos 500–700), carregada via
  Google Fonts. Cara de placar esportivo. Aplicada a: valores de KPI, número central do
  anel, números grandes do hero e títulos de seção.
- `--font-body: 'Inter', sans-serif;`
- `--font-display: 'Oswald', 'Inter', sans-serif;`

---

## 3. Estrutura do Layout

Container central com `max-width: 1280px` e espaçamento generoso. Ordem vertical:

1. **Header** — ícone 🥋 + título com palavra de acento; à direita: LED de sync +
   botão "Atualizar" com contorno vibrante.
2. **Barra de Filtros** — linha compacta e responsiva com grupos ANO / MÊS / MODALIDADE
   em *pills*; pill ativa recebe preenchimento de acento com leve glow.
3. **Hero de Meta (novo — peça-foco)** — ver §4.1.
4. **Grid de KPIs (6)** — bento responsivo, ver §4.2.
5. **Linha de Gráficos (2)** — barras mensais + rosca de tipos, ver §4.3.
6. **Tabela de Atividades** — feed estilizado, ver §4.4.

**Responsividade:**
- ≥ 1024px: hero em 2 colunas internas (anel | blocos de ritmo); KPIs em 3 colunas;
  gráficos lado a lado.
- 768–1023px: hero empilha (anel acima, ritmo abaixo); KPIs em 2–3 colunas.
- < 768px: tudo em coluna única; KPIs em 2 colunas; tabela com scroll horizontal.

---

## 4. Componentes

### 4.1 Hero de Meta Radial (novo)

Bloco de destaque com fundo `--bg-elev` e glow sutil do `--grad-hero`.

- **Anel radial (SVG):** elemento `<svg>` com dois `<circle>` concêntricos:
  - Trilha de fundo (cinza `--border`, espessura ~18px).
  - Traço de progresso com `stroke-dasharray`/`stroke-dashoffset`, pintado com gradiente
    `--grad-hero`, `stroke-linecap: round`, iniciando no topo (`rotate(-90)`).
  - **Overflow > 100%:** um terceiro `<circle>` em `--violet` desenha a volta extra
    quando os treinos passam de 130.
- **Centro do anel:** `%` em `Oswald` gigante + subtítulo `X / 130` + label `META 2026`
  (ano reflete o filtro selecionado).
- **Blocos de ritmo (3), à direita do anel):**
  1. **Status do Ritmo** — texto + cor por estado (adiantado=`--teal`, no ritmo=`--warn`,
     atrasado=`--danger`).
  2. **Projeção Anual** — número + mini-barra de progresso colorida.
  3. **Para bater a meta** — treinos/semana necessários.

**Implementação:** remove o `gaugeChart` (Chart.js) do `initCharts`; `updateAnnualGoalUI`
passa a manipular `stroke-dashoffset` do círculo SVG em vez do doughnut. Os cálculos de
`currentTotal`, `paceDiff`, `projection` e `reqWeekly` permanecem idênticos.

### 4.2 Grid de KPIs (6 cards)

Cards bento com `--bg-elev`, borda `--border`, número em `Oswald` grande:
TOTAL DE TREINOS · DURAÇÃO MÉDIA · HORAS TOTAIS · ALTA INTENSIDADE · TREINOS GI ·
TREINOS NO-GI. Cada card tem cor de acento por métrica e ícone discreto. **Hover:**
elevação (`translateY(-2px)`) + glow de borda no acento.

### 4.3 Gráficos de Suporte (Chart.js, re-tema)

- **Barras mensais:** preenchimento com gradiente vertical azul, cantos arredondados,
  grade `--border`, ticks em `Inter`/`Oswald`.
- **Rosca de tipos (Técnica/Sparring/Seminário):** cores `--blue`/`--teal`/`--violet`,
  borda na cor `--bg-elev`, legenda à direita em `--text`.
- Mantém estrutura de dados e atualização atuais (`barChart`/`donutChart`).

### 4.4 Tabela de Atividades

Cabeçalhos em `--text-muted` com `letter-spacing`; linhas com divisória sutil e hover
discreto. **Tags translúcidas:**
- `Gi` → fundo `rgba(46,139,255,0.14)`, texto `--blue`.
- `No-Gi` → fundo `rgba(255,77,94,0.14)`, texto `--danger`.
- `Tipo` (Técnica) → violeta translúcido; demais → cinza translúcido.
- Intensidade `Alta` em `--danger`, demais em `--teal`/`--text-muted`.

**Estado vazio:** célula central com 🥋 e mensagem motivacional
("Nenhum treino neste período. Hora de vestir o kimono!").

---

## 5. Fluxo de Dados e Comportamento (inalterado)

- Busca: `fetch('/api/treinos')` → `globalResults` → `applyFilters()`. **Sem mudanças.**
- Filtros de Ano/Mês/Modalidade afetam hero, KPIs, gráficos e tabela de forma síncrona,
  como hoje.
- **LED de sync:** teal (conectado), vermelho piscante (fallback/erro). O texto de status
  reflete os mesmos estados já tratados em `fetchTreinos`.

---

## 6. Acessibilidade

- Contraste mínimo AA para texto sobre fundo escuro; cores vibrantes usadas em blocos com
  contraste verificado.
- `prefers-reduced-motion`: desliga animação do anel (transição de `stroke-dashoffset`),
  pulsos de glow e hovers animados.
- Foco visível em pills, botões e linhas interativas.
- HTML semântico mantido (`header`, `section`, `table`).

---

## 7. Mapeamento de Arquivos

| Arquivo | Mudança |
|---------|---------|
| `public/index.css` | **Reescrita completa** — tokens, layout, hero, KPIs, gráficos, tabela, estados, responsivo, reduced-motion. Resolve o CSS quebrado. |
| `public/index.html` | Reorganização do layout, novo hero com SVG do anel, link da fonte Oswald. |
| `public/main.js` | Remover `gaugeChart`; `updateAnnualGoalUI` manipula o anel SVG; re-tema de `barChart`/`donutChart`; estado vazio. **Parsing de dados e fetch inalterados.** |
| `server.js` | **Sem alterações.** |

---

## 8. Plano de Verificação

### 8.1 Interface
- **Filtros:** clicar em Ano/Mês/Modalidade e validar que hero (anel + ritmo), KPIs,
  gráficos e tabela atualizam em sincronia.
- **Responsividade:** 375 / 768 / 1024 / 1440 px — colunas empilham corretamente, sem
  overflow; tabela com scroll lateral no mobile.

### 8.2 Casos de borda
- **Sem dados:** seleção sem resultados exibe o estado vazio motivacional.
- **Meta > 100%:** configurar temporariamente > 130 treinos para validar a volta extra
  do anel em violeta.
- **Erro/fallback:** invalidar a chave do `.env`, reiniciar e confirmar LED vermelho
  piscante + texto "Modo Demonstração"; depois restaurar o `.env`.

### 8.3 Acessibilidade
- Verificar contraste das cores vibrantes e funcionamento de `prefers-reduced-motion`.
