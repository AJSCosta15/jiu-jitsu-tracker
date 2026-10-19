const test = require('node:test');
const assert = require('node:assert');
const { createCache } = require('../lib/cache');

test('cache retorna valor dentro do TTL e expira depois', () => {
  let t = 1000;
  const cache = createCache(300000, () => t);
  cache.set('a', 1);
  t = 1000 + 299999;
  assert.strictEqual(cache.get('a'), 1);
  t = 1000 + 300001;
  assert.strictEqual(cache.get('a'), undefined);
});

test('cache retorna undefined para chave inexistente', () => {
  assert.strictEqual(createCache(10, () => 0).get('x'), undefined);
});
