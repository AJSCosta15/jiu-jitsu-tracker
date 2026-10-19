import { escapeHtml } from './dom.js';
import { filterTreinos, goalYearTreinos, computeGoal, computeKpis } from './calc-treinos.js';

const GOAL = 130;
const RING_CIRC = 565.48;
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const LED_CLASS = { ok: 'led-dot led-teal', demo: 'led-dot led-red', error: 'led-dot led-red' };

let currentTreinos = [];
let barChart = null;
let donutChart = null;

const byId = (id) => document.getElementById(id);
const setText = (id, text) => { const el = byId(id); if (el) el.innerText = text; };

export function setSyncStatus(kind, text) {
  const led = byId('sync-led');
  if (led) led.className = LED_CLASS[kind] || LED_CLASS.error;
  if (text !== undefined && text !== null) setText('sync-status', text);
}

export function formatPace(paceDiff) {
  if (paceDiff >= 1.5) return { icon: '🟢', text: `${Math.round(paceDiff)} treinos adiantado` };
  if (paceDiff <= -1.5) return { icon: '🔴', text: `${Math.abs(Math.round(paceDiff))} treinos atrasado` };
  return { icon: '🟡', text: 'No ritmo!' };
}

export function formatProjection(projection) {
  return projection === null ? '-- treinos' : `${Math.round(projection)} treinos/ano`;
}

export function formatWeekly(goal) {
  if (goal.goalReached) return 'Meta atingida! 🏆';
  return goal.weeklyRequired === null ? '--' : `${goal.weeklyRequired.toFixed(1)} treinos/semana`;
}

export function projBarStyle(projFraction) {
  if (projFraction === null) return { width: '0%', color: null };
  let color = 'var(--danger)';
  if (projFraction >= 1) color = 'var(--teal)';
  else if (projFraction >= 0.9) color = 'var(--blue)';
  else if (projFraction >= 0.75) color = 'var(--warn)';
  return { width: `${Math.min(100, Math.round(projFraction * 100))}%`, color };
}

export function ringOffsets(fraction) {
  if (fraction <= 1) return { main: RING_CIRC - fraction * RING_CIRC, extra: null };
  return { main: 0, extra: RING_CIRC - Math.min(1, fraction - 1) * RING_CIRC };
}

function renderRing(fraction) {
  const ring = byId('ring-progress');
  const extra = byId('ring-progress-extra');
  if (!ring) return;
  const offsets = ringOffsets(fraction);
  ring.style.strokeDashoffset = offsets.main;
  if (!extra) return;
  extra.style.display = offsets.extra === null ? 'none' : 'block';
  if (offsets.extra !== null) extra.style.strokeDashoffset = offsets.extra;
}

function renderGoal(list, targetYear) {
  const goal = computeGoal(list.length, targetYear, new Date(), GOAL);
  setText('goal-percent', `${goal.percent}%`);
  setText('goal-text', `${list.length} / ${GOAL}`);
  setText('goal-year', String(targetYear));
  renderRing(goal.ringFraction);
  const pace = formatPace(goal.paceDiff);
  setText('pace-status', pace.text);
  setText('pace-icon', pace.icon);
  setText('projection', formatProjection(goal.projection));
  const bar = projBarStyle(goal.projFraction);
  const projBar = byId('proj-bar');
  if (projBar) {
    projBar.style.width = bar.width;
    if (bar.color) projBar.style.backgroundColor = bar.color;
  }
  setText('weekly-req', formatWeekly(goal));
}

const EMPTY_ROW = `
            <tr><td colspan="7" style="text-align:center; padding:48px; color: var(--text-muted);">
                <div style="font-size:28px; margin-bottom:12px;">🥋</div>
                <div>Nenhum treino registrado neste período. Hora de vestir o kimono!</div>
            </td></tr>`;

function rowHtml(t) {
  const mod = t.modalidade;
  const modClass = mod === 'Gi' ? 'tag-blue' : (mod ? 'tag-red' : '');
  const modLabel = mod === 'Gi' ? '🔵 Gi' : (mod ? '🔴 No-Gi' : '');
  const typeClass = t.tipo === 'Técnica' ? 'tag-violet' : 'tag-grayblue';
  const intClass = t.intensidade === 'Alta' ? 'text-danger' : 'text-teal';
  const date = t.data ? t.data.split('-').reverse().join('/') : '--';
  return `
                <tr>
                    <td>${escapeHtml(date)}</td>
                    <td><strong>${escapeHtml(t.nome)}</strong></td>
                    <td><span class="tag-pill ${modClass}">${escapeHtml(modLabel || mod)}</span></td>
                    <td><span class="tag-pill ${typeClass}">${escapeHtml(t.tipo || '--')}</span></td>
                    <td>${t.duracaoMin ? `${t.duracaoMin} min` : '--'}</td>
                    <td class="${intClass}"><strong>${escapeHtml(t.intensidade || '--')}</strong></td>
                    <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(t.foco || '--')}</td>
                </tr>
            `;
}

function renderFiltered(list) {
  const kpis = computeKpis(list);
  byId('treinos-body').innerHTML = list.length === 0 ? EMPTY_ROW : list.map(rowHtml).join('');
  setText('kpi-total', kpis.total);
  byId('kpi-avg-duration').innerHTML = `${kpis.avgMinutes} <span class="kpi-unit">min</span>`;
  setText('kpi-hours', kpis.hours);
  setText('kpi-high-intensity', kpis.highIntensity);
  setText('kpi-gi', kpis.gi);
  setText('kpi-nogi', kpis.nogi);
  barChart.data.datasets[0].data = kpis.monthCounts;
  barChart.update();
  donutChart.data.datasets[0].data = kpis.donut;
  donutChart.update();
  setText('table-title', `TREINOS (${kpis.total} EXIBIDOS)`);
}

const activeVal = (id) => document.querySelector(`#${id} .pill.active`).dataset.val;

export function renderTreinos(treinos) {
  currentTreinos = treinos;
  const filters = { year: activeVal('filter-year'), month: activeVal('filter-month'), modality: activeVal('filter-modality') };
  const { targetYear, list } = goalYearTreinos(currentTreinos, filters.year, new Date());
  renderGoal(list, targetYear);
  renderFiltered(filterTreinos(currentTreinos, filters));
}

function initCharts() {
  Chart.defaults.color = '#8B949E';
  Chart.defaults.borderColor = '#30363D';
  Chart.defaults.font.family = 'Inter, sans-serif';

  const ctxBar = byId('bar-chart').getContext('2d');
  const gradient = ctxBar.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, '#2E8BFF');
  gradient.addColorStop(1, 'rgba(46, 139, 255, 0.10)');
  barChart = new Chart(ctxBar, {
    type: 'bar',
    data: { labels: MONTH_LABELS, datasets: [{ label: 'Treinos', data: Array(12).fill(0), backgroundColor: gradient, borderRadius: 6, borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: '#23262F' } }, x: { grid: { display: false } } },
    },
  });

  donutChart = new Chart(byId('donut-chart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Técnica', 'Sparring', 'Seminário'],
      datasets: [{ data: [0, 0, 0], backgroundColor: ['#2E8BFF', '#19E3C2', '#7C5CFF'], borderWidth: 3, borderColor: '#13151B' }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: { legend: { position: 'right', labels: { color: '#EDEFF4', boxWidth: 12, font: { size: 12, weight: '600' } } } },
    },
  });
}

function onPillClick(event) {
  const pill = event.currentTarget;
  pill.closest('.pills-container').querySelectorAll('.pill').forEach((p) => {
    p.classList.remove('active');
    p.setAttribute('aria-pressed', 'false');
  });
  pill.classList.add('active');
  pill.setAttribute('aria-pressed', 'true');
  renderTreinos(currentTreinos);
}

export function initTreinosUI() {
  initCharts();
  document.querySelectorAll('.pill').forEach((pill) => pill.addEventListener('click', onPillClick));
}
