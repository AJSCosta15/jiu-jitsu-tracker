import { fetchTreinos, fetchGraduacoes } from './api.js';
import { initTreinosUI, renderTreinos, setSyncStatus } from './treinos-ui.js';
import { renderGraduacoes } from './graduacoes-ui.js';
import { initTabs } from './tabs.js';

const pad = (n) => String(n).padStart(2, '0');

function localTodayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Returns the loaded treinos, or null when they are unavailable (demo mode or error).
// isCurrent() turns false when a newer load started, so stale responses never paint.
async function loadTreinos(refresh, isCurrent) {
  setSyncStatus('ok');
  try {
    const data = await fetchTreinos(refresh);
    if (!isCurrent()) return null;
    if (data.fallback) {
      setSyncStatus('demo', '⚠️ Modo Demonstração (Verifique .env)');
      return null;
    }
    if (data.error) throw new Error(data.error);
    if (!data.results) return null;
    setSyncStatus('ok', `✅ ${data.results.length} treinos carregados do Notion`);
    renderTreinos(data.results);
    return data.results;
  } catch (e) {
    if (!isCurrent()) return null;
    console.error('Error fetching treinos:', e);
    setSyncStatus('error', '❌ Falha ao carregar dados do proxy local.');
    return null;
  }
}

function graduacoesState(result, treinos) {
  if (result.status === 'rejected') {
    return { status: 'error', message: 'Falha ao carregar graduações do proxy local.' };
  }
  const data = result.value || {};
  if (data.error) return { status: 'error', message: data.error };
  if (data.fallback) return { status: 'error', message: data.message || 'Banco de graduações não configurado' };
  const graduacoes = data.results || [];
  return { status: graduacoes.length ? 'ok' : 'empty', graduacoes, treinos };
}

let latestLoadId = 0;

async function loadAll(refresh) {
  const loadId = ++latestLoadId;
  const isCurrent = () => loadId === latestLoadId;
  renderGraduacoes({ status: 'loading' }, localTodayISO());
  const [treinosResult, gradResult] = await Promise.allSettled([
    loadTreinos(refresh, isCurrent),
    fetchGraduacoes(refresh),
  ]);
  if (!isCurrent()) return;
  const treinos = treinosResult.status === 'fulfilled' ? treinosResult.value : null;
  renderGraduacoes(graduacoesState(gradResult, treinos), localTodayISO());
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initTreinosUI();
  loadAll(false);
  document.getElementById('refresh-btn').addEventListener('click', () => loadAll(true));
});
