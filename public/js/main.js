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
async function loadTreinos(refresh) {
  setSyncStatus('ok');
  try {
    const data = await fetchTreinos(refresh);
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

async function loadAll(refresh) {
  renderGraduacoes({ status: 'loading' }, localTodayISO());
  const [treinosResult, gradResult] = await Promise.allSettled([
    loadTreinos(refresh),
    fetchGraduacoes(refresh),
  ]);
  const treinos = treinosResult.status === 'fulfilled' ? treinosResult.value : null;
  renderGraduacoes(graduacoesState(gradResult, treinos), localTodayISO());
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initTreinosUI();
  loadAll(false);
  document.getElementById('refresh-btn').addEventListener('click', () => loadAll(true));
});
