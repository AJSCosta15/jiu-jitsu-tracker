import { fetchTreinos } from './api.js';
import { initTreinosUI, renderTreinos, setSyncStatus } from './treinos-ui.js';

async function loadTreinos(refresh) {
  setSyncStatus('ok');
  try {
    const data = await fetchTreinos(refresh);
    if (data.fallback) {
      setSyncStatus('demo', '⚠️ Modo Demonstração (Verifique .env)');
      return;
    }
    if (data.error) throw new Error(data.error);
    if (data.results) {
      setSyncStatus('ok', `✅ ${data.results.length} treinos carregados do Notion`);
      renderTreinos(data.results);
    }
  } catch (e) {
    console.error('Error fetching treinos:', e);
    setSyncStatus('error', '❌ Falha ao carregar dados do proxy local.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTreinosUI();
  loadTreinos(false);
  document.getElementById('refresh-btn').addEventListener('click', () => loadTreinos(true));
});
