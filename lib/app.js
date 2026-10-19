const express = require('express');
const path = require('path');
const { normalizeTreino, normalizeGraduacao } = require('./normalize');
const { createCache } = require('./cache');

const DEFAULT_TTL_MS = 300000;
const PLACEHOLDER_ID = 'seu_database_id_aqui';

const isAccessError = (error) =>
  Boolean(error) && (error.status === 404 || error.code === 'object_not_found');

const byDateAsc = (a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0);

function createApp({ queryDatabase, treinosDbId, graduacoesDbId, ttlMs = DEFAULT_TTL_MS, now }) {
  const app = express();
  const cache = createCache(ttlMs, now);
  app.use(express.static(path.join(__dirname, '..', 'public')));

  const route = ({ key, dbId, fallbackMessage, normalize, sort = (list) => list }) =>
    async (req, res) => {
      if (!dbId || dbId === PLACEHOLDER_ID) {
        return res.json({ fallback: true, message: fallbackMessage, results: [] });
      }
      try {
        const cached = req.query.refresh === '1' ? undefined : cache.get(key);
        if (cached) return res.json(cached);
        const pages = await queryDatabase(dbId);
        const payload = { fallback: false, results: sort(pages.map(normalize)) };
        cache.set(key, payload);
        return res.json(payload);
      } catch (error) {
        console.error('Notion API Error:', error && error.body ? error.body : error);
        if (isAccessError(error)) {
          return res.status(502).json({ error: 'A integração do Notion não tem acesso a este banco' });
        }
        return res.status(500).json({ error: 'Erro ao buscar dados do Notion' });
      }
    };

  app.get('/api/treinos', route({
    key: 'treinos',
    dbId: treinosDbId,
    fallbackMessage: 'Configure as chaves do Notion no .env',
    normalize: normalizeTreino,
  }));

  app.get('/api/graduacoes', route({
    key: 'graduacoes',
    dbId: graduacoesDbId,
    fallbackMessage: 'Configure NOTION_GRADUACOES_DB_ID',
    normalize: normalizeGraduacao,
    sort: (list) => [...list].sort(byDateAsc),
  }));

  return app;
}

module.exports = { createApp };
