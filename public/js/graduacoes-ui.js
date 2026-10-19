import { escapeHtml } from './dom.js';
import { beltHtml } from './belt.js';
import { buildTimeline, journeySummary, formatDuration } from './calc-graduacoes.js';

const formatDateBR = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const sinceText = (duration) => {
  const text = formatDuration(duration);
  return text === 'hoje' ? 'desde hoje' : `há ${text}`;
};

function statusHtml(kind, text) {
  return `<div class="grad-state grad-state--${kind}" role="status">${escapeHtml(text)}</div>`;
}

function summaryHtml(summary) {
  const counts = summary.totalTreinos === null ? ''
    : `<span class="grad-hero-fact"><strong>${summary.totalTreinos}</strong> treinos · <strong>${escapeHtml(summary.horas)}</strong> h</span>`;
  return `<section class="card grad-hero" aria-label="Graduação atual">
    <span class="grad-hero-label">GRADUAÇÃO ATUAL</span>
    ${beltHtml(summary.faixa, summary.grau, 'lg')}
    <h2 class="grad-hero-title">Faixa ${escapeHtml(summary.faixa)} <span class="grad-hero-grau">· ${escapeHtml(summary.grau || 'Sem grau')}</span></h2>
    <div class="grad-hero-facts">
      <span class="grad-hero-fact">na faixa ${escapeHtml(sinceText(summary.tempoNaFaixa))}</span>
      <span class="grad-hero-fact">jornada de <strong>${escapeHtml(formatDuration(summary.tempoTotal))}</strong></span>
      ${counts}
    </div>
  </section>`;
}

function metaHtml(marco) {
  const parts = [marco.professor, marco.academia].filter(Boolean).map(escapeHtml);
  const meta = parts.length ? `<p class="tl-meta">${parts.join(' · ')}</p>` : '';
  const obs = marco.observacoes ? `<p class="tl-obs">${escapeHtml(marco.observacoes)}</p>` : '';
  return meta + obs;
}

function gapHtml(intervalo) {
  const facts = [escapeHtml(formatDuration(intervalo.duracao))];
  if (intervalo.treinos !== null) {
    facts.push(escapeHtml(plural(intervalo.treinos, 'treino', 'treinos')), `${escapeHtml(intervalo.horas)} h`);
  }
  const tag = intervalo.emAndamento ? '<span class="tl-live">em andamento</span>' : '';
  const cls = intervalo.emAndamento ? 'tl-gap tl-gap--live' : 'tl-gap';
  return `<div class="${cls}">${tag}<span class="tl-gap-facts">${facts.join('<i aria-hidden="true">·</i>')}</span></div>`;
}

function itemHtml({ marco, intervalo }, index) {
  return `<li class="tl-item" style="--i:${index}">
    <article class="tl-card">
      <time class="tl-date" datetime="${escapeHtml(marco.data)}">${escapeHtml(formatDateBR(marco.data))}</time>
      <h3 class="tl-title">${escapeHtml(marco.titulo)}</h3>
      ${beltHtml(marco.faixa, marco.grau)}
      ${metaHtml(marco)}
    </article>
    ${gapHtml(intervalo)}
  </li>`;
}

function timelineHtml(graduacoes, treinos, todayISO) {
  const items = buildTimeline(graduacoes, treinos, todayISO);
  const notice = treinos === null
    ? '<p class="grad-notice">Contagem de treinos indisponível</p>' : '';
  return `<section class="card grad-timeline-card" aria-label="Linha do tempo">
    <h3>LINHA DO TEMPO</h3>
    ${notice}
    <ol class="timeline">${items.map(itemHtml).join('')}</ol>
  </section>`;
}

export function renderGraduacoes(state, todayISO) {
  const root = document.getElementById('graduacoes-root');
  if (state.status === 'loading') {
    root.innerHTML = statusHtml('loading', 'Carregando graduações...');
    return;
  }
  if (state.status === 'error') {
    root.innerHTML = statusHtml('error', state.message || 'Erro ao carregar graduações');
    return;
  }
  const summary = state.status === 'ok' ? journeySummary(state.graduacoes, state.treinos, todayISO) : null;
  if (!summary) {
    root.innerHTML = statusHtml('empty', 'Nenhuma graduação cadastrada no Notion');
    return;
  }
  root.innerHTML = summaryHtml(summary) + timelineHtml(state.graduacoes, state.treinos, todayISO);
}
