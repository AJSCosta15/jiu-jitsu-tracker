# Aba "Graduações" + ajustes de base — Design

**Data:** 2026-10-19
**Projeto:** Jiu-Jitsu Arena (painel pessoal, Express + JS vanilla, publicado na Vercel, dados do Notion)

## Intenção

O Anderson quer ver sua jornada no Jiu-Jitsu como uma **linha do tempo**: início dos treinos, cada grau e cada faixa, com data, professor e academia. Quer também saber **quanto treino foi preciso entre um marco e outro**. Junto com isso, a base atual recebe ajustes de robustez **sem quebrar nem mudar o visual/comportamento da aba de treinos**.

O painel é pessoal, mas as informações são públicas: **o link continua aberto, sem senha** (decisão dele, para não ter que autenticar).

## Objetivos

1. Nova aba **"Graduações"**, ao lado da aba atual (que passa a se chamar **"Treinos"**).
2. Linha do tempo alimentada pelo banco do Notion **🥇 Graduações**, que se atualiza sozinha quando ele cadastra um marco novo no Notion.
3. Para cada intervalo entre dois marcos: **duração, número de treinos e horas de tatame**.
4. Ajustes de base: payload enxuto, escape de HTML, cache, configuração por env e testes dos cálculos.

## Não-objetivos

- Autenticação/senha (decisão explícita: não).
- Editar dados pelo painel (o Notion continua sendo a única fonte de escrita).
- Redesenhar a aba Treinos ou trocar a stack (sem framework, sem bundler).

## Anti-objetivos (seria falha mesmo funcionando)

- Qualquer regressão na aba Treinos: KPIs, meta de 130, anel, filtros e gráficos devem dar exatamente os mesmos números de hoje.
- Quebrar o deploy na Vercel.
- Vazar a chave do Notion ou mandar o JSON bruto do Notion para o navegador.

## Fonte de dados: banco "🥇 Graduações"

- Database: `f3ad096e-f617-46a5-859f-41a6a165102e` (data source `collection://1ed37818-e7ea-4309-9dee-e610b7c62011`), dentro da página "🥋 Jiu-Jitsu — Rastreador", irmão do banco de treinos.
- Propriedades: `Graduação` (title), `Data` (date), `Faixa` (select: Branca, Cinza, Amarela, Laranja, Verde, Azul, Roxa, Marrom, Preta), `Grau` (select: Sem grau, 1º–4º Grau), `Academia / Evento` (text), `Professor` (text), `Observações` (text).
- Dados atuais (4): Início Branca 2025-08-04 · 1º Grau 2025-12-01 · 2º Grau 2026-03-13 · Faixa Azul 2026-10-18. Academia "Diego Nery Jiu-Jitsu", professor "Rick Dias".
- Nova variável de ambiente: **`NOTION_GRADUACOES_DB_ID`**, a ser adicionada em `.env`, em `.env.example` e na Vercel. A integração do Notion precisa ter acesso a esse banco. Se ela já foi conectada à página-pai "Rastreador", o acesso é herdado; se não, a API retorna 404 e isso deve virar uma mensagem clara na aba.

## Backend (server.js → módulos pequenos)

- Manter `GET /api/treinos`, mudando a **forma** da resposta para um array normalizado: `{ id, nome, data, duracaoMin, modalidade, tipo, intensidade, foco }`. O front é adaptado na mesma entrega. O formato `{ fallback, results }` continua, para o modo demonstração funcionar como hoje.
- Novo `GET /api/graduacoes` → `{ fallback, results: [{ id, titulo, data, faixa, grau, academia, professor, observacoes }] }`, ordenado por data crescente.
- Separar em módulos: cliente/consulta do Notion, normalizadores (funções puras, testáveis) e rotas. Arquivos pequenos.
- **Cache em memória** por endpoint, TTL de 5 min. `?refresh=1` ignora o cache (o botão "Atualizar" envia esse parâmetro). Na Vercel o cache vive só enquanto a instância está quente; isso é aceitável.
- Erros: logar o detalhe no servidor e responder ao cliente apenas `{ error: "mensagem amigável" }`, sem `details`.
- Remover `cors()` (front e API ficam na mesma origem).
- `vercel.json`: manter funcionando. Se a reorganização exigir, o builder pode ajustar, desde que `/api/*` e os estáticos continuem servidos.

## Frontend

- **Abas** no header: "Treinos" | "Graduações", com `role="tablist"`, teclado e `aria-selected`. A aba ativa fica no hash da URL (`#graduacoes`), para dar refresh e compartilhar o link. Padrão: Treinos.
- Os filtros (ano/mês/modalidade) pertencem só à aba Treinos e ficam ocultos na aba Graduações.
- **Escape de HTML** em todo texto vindo do Notion (tabela de treinos e linha do tempo).
- Dividir `main.js` em módulos ES (`<script type="module">`): ex. `api.js`, `treinos.js`, `graduacoes.js`, `calc.js` (puro), `dom.js` (escape/helpers). O nome e a divisão exata ficam a critério do builder.

### Aba Graduações — conteúdo

1. **Destaque no topo:** faixa atual desenhada (cor da faixa + ponteira preta com listras brancas para os graus; ponteira vermelha na preta), "Faixa Azul · Sem grau", **há quanto tempo nela**, contado a partir da data em que **recebeu a faixa atual** (o marco mais antigo com a faixa atual, e não o último grau; decisão do Anderson; ex.: "Faixa Azul há 5 meses" mesmo depois de um 1º grau recente) e **tempo total de jornada** desde o "Início" (ex.: "1 ano e 2 meses"), com total de treinos e horas.
2. **Linha do tempo vertical**, do mais antigo (topo) para o mais recente. Cada marco tem a data (dd/mm/aaaa), o título, o desenho da faixa/grau, o professor, a academia e as observações (quando houver).
3. **Entre dois marcos**, um conector com: duração ("3 meses e 27 dias"), **nº de treinos** e **horas** no intervalo. Após o último marco, um trecho **"em andamento"** até hoje.
4. Estados de carregando, vazio ("Nenhuma graduação cadastrada no Notion") e erro (incluindo o caso de falta de acesso da integração).
5. **Falhas cruzadas (decisão minha):** se os treinos não carregarem (erro ou modo demonstração), a linha do tempo aparece normalmente com as durações e esconde as contagens de treinos e horas, com um aviso discreto. Se as graduações falharem, o erro aparece só dentro da aba Graduações. O LED e o status do header continuam refletindo apenas os treinos, como hoje.
6. **Verificação prévia do builder:** confirmar com uma chamada real que `databases.query` (SDK `@notionhq/client` 2.x, já usado) funciona com o ID do banco de graduações. Só atualizar o SDK se for necessário.

### Regras de cálculo (puras e testadas)

- Treino conta no intervalo [marco A, marco B) se `marcoA.data <= treino.data < marcoB.data`. O trecho em andamento vai de `[último marco, hoje]`, inclusive.
- Treinos sem data são ignorados nos intervalos.
- Horas = soma de `duracaoMin` / 60, com 1 casa decimal (mesmo critério do KPI atual).
- Duração em anos/meses/dias por calendário, não por 30 dias fixos. Datas tratadas como datas locais (`YYYY-MM-DD`, sem fuso), como a aba Treinos já faz.
- Os intervalos usam **todos** os treinos, independente dos filtros da aba Treinos.

### Visual

Seguir a identidade "Arena" já existente (tokens do `index.css`, Oswald para números e títulos, Inter para texto, tema escuro). Cores das faixas fiéis (branca, azul, roxa, marrom, preta etc.), legíveis no fundo escuro (a branca precisa de borda). Responsivo até 320px, respeitando `prefers-reduced-motion`. Uma animação sutil de entrada da linha do tempo é permitida.

## Ajustes de base — resumo

| Item | Hoje | Depois |
|---|---|---|
| Payload | JSON bruto do Notion | objetos normalizados |
| XSS | `innerHTML` sem escape | escape em todo texto do Notion |
| Erros | `details: error` para o cliente | mensagem genérica; detalhe só no log |
| Cache | nenhum | 5 min em memória + `?refresh=1` |
| CORS | aberto | removido |
| Config | só treinos no env | + `NOTION_GRADUACOES_DB_ID` |
| Testes | nenhum | testes unitários dos cálculos e normalizadores |

## Testes

- Runner: `node:test` nativo (sem dependências novas). Script `npm test`.
- Cobrir: normalizadores (treino e graduação, incluindo campos vazios), cálculos de meta/ritmo/projeção extraídos da aba atual (para travar o comportamento), agregação de KPIs, intervalos entre graduações (bordas: treino no dia do marco, sem treinos, um único marco, trecho em andamento), duração por calendário e escape de HTML.
- Verificação manual no navegador: aba Treinos com os mesmos números de antes; aba Graduações com os 4 marcos reais.

## Decisões tomadas por mim (Claude), não pelo Anderson

- Nome da aba "Graduações"; ordem cronológica crescente; aba ativa no hash da URL.
- TTL de 5 minutos; runner `node:test`; divisão em módulos ES.
- Filtros escondidos na aba Graduações; intervalos ignoram os filtros.
- Sem senha (decisão dele); `cors` removido.

## Fora do escopo / para depois

- Tempo médio por grau comparado com referências da IBJJF.
- Fotos/certificados anexados no Notion.
- Reescrever o `agents.md` (desatualizado). O builder deve, sim, atualizar o README com a nova env e a nova aba.
