const { test } = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../lib/app');

const treinoPage = {
  id: 't1',
  properties: {
    Treino: { title: [{ plain_text: 'Aula' }] },
    Data: { date: { start: '2026-01-01' } },
    'Duração (min)': { number: 60 },
    Modalidade: { select: { name: 'Gi' } },
    Tipo: { select: { name: 'Aula' } },
    Intensidade: { select: { name: 'Alta' } },
    'Foco do Treino': { rich_text: [{ plain_text: 'guarda' }] },
  },
};

const gradPage = (id, date) => ({
  id,
  properties: { Graduação: { title: [{ plain_text: id }] }, Data: { date: { start: date } } },
});

async function withServer(opts, fn) {
  const app = createApp(opts);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.close();
  }
}

const baseOpts = (queryDatabase, extra = {}) => ({
  queryDatabase,
  treinosDbId: 'tdb',
  graduacoesDbId: 'gdb',
  ...extra,
});

test('treinos retorna objetos normalizados', async () => {
  await withServer(baseOpts(async () => [treinoPage]), async (base) => {
    const body = await (await fetch(`${base}/api/treinos`)).json();
    assert.strictEqual(body.fallback, false);
    assert.deepStrictEqual(Object.keys(body.results[0]),
      ['id', 'nome', 'data', 'duracaoMin', 'modalidade', 'tipo', 'intensidade', 'foco']);
  });
});

test('graduacoes vem ordenada por data', async () => {
  const q = async () => [gradPage('a', '2026-03-13'), gradPage('b', '2025-08-04')];
  await withServer(baseOpts(q), async (base) => {
    const body = await (await fetch(`${base}/api/graduacoes`)).json();
    assert.deepStrictEqual(body.results.map((r) => r.data), ['2025-08-04', '2026-03-13']);
  });
});

test('segunda chamada usa cache', async () => {
  let calls = 0;
  const q = async () => { calls += 1; return [treinoPage]; };
  await withServer(baseOpts(q), async (base) => {
    await fetch(`${base}/api/treinos`);
    await fetch(`${base}/api/treinos`);
    assert.strictEqual(calls, 1);
  });
});

test('refresh=1 ignora cache', async () => {
  let calls = 0;
  const q = async () => { calls += 1; return [treinoPage]; };
  await withServer(baseOpts(q), async (base) => {
    await fetch(`${base}/api/treinos`);
    await fetch(`${base}/api/treinos?refresh=1`);
    assert.strictEqual(calls, 2);
  });
});

test('sem graduacoesDbId retorna fallback', async () => {
  await withServer(baseOpts(async () => [], { graduacoesDbId: '' }), async (base) => {
    const res = await fetch(`${base}/api/graduacoes`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).fallback, true);
  });
});

test('erro não vaza detalhes', async () => {
  const q = async () => { throw new Error('segredo'); };
  const orig = console.error;
  console.error = () => {};
  try {
    await withServer(baseOpts(q), async (base) => {
      const res = await fetch(`${base}/api/treinos`);
      assert.strictEqual(res.status, 500);
      assert.deepStrictEqual(await res.json(), { error: 'Erro ao buscar dados do Notion' });
    });
  } finally {
    console.error = orig;
  }
});

test('404 do Notion vira mensagem de acesso', async () => {
  const q = async () => { throw { status: 404 }; };
  const orig = console.error;
  console.error = () => {};
  try {
    await withServer(baseOpts(q), async (base) => {
      const res = await fetch(`${base}/api/graduacoes`);
      assert.strictEqual(res.status, 502);
      assert.deepStrictEqual(await res.json(),
        { error: 'A integração do Notion não tem acesso a este banco' });
    });
  } finally {
    console.error = orig;
  }
});
