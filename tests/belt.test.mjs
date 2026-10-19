import test from 'node:test';
import assert from 'node:assert';
import { beltModel, beltHtml } from '../public/js/belt.js';
import { tabFromHash } from '../public/js/tabs.js';

test('beltModel maps faixa to slug and grau to stripe count', () => {
  assert.deepStrictEqual(beltModel('Azul', 'Sem grau'), { slug: 'azul', stripes: 0, tip: 'black' });
  assert.deepStrictEqual(beltModel('Branca', '2º Grau'), { slug: 'branca', stripes: 2, tip: 'black' });
  assert.deepStrictEqual(beltModel('Preta', '4º Grau'), { slug: 'preta', stripes: 4, tip: 'red' });
});

test('beltModel tolerates unknown values', () => {
  assert.deepStrictEqual(beltModel('Rosa', 'xyz'), { slug: 'desconhecida', stripes: 0, tip: 'black' });
  assert.deepStrictEqual(beltModel('', ''), { slug: 'desconhecida', stripes: 0, tip: 'black' });
  assert.strictEqual(beltModel('Marrom', '9º Grau').stripes, 4);
});

test('beltHtml escapes the label and renders one stripe per grau', () => {
  const html = beltHtml('Roxa', '3º Grau');
  assert.match(html, /belt--roxa/);
  assert.strictEqual((html.match(/belt-stripe/g) || []).length, 3);
  assert.doesNotMatch(beltHtml('<b>', 'Sem grau'), /<b>/);
});

test('tabFromHash only recognises #graduacoes', () => {
  assert.strictEqual(tabFromHash('#graduacoes'), 'graduacoes');
  assert.strictEqual(tabFromHash('#treinos'), 'treinos');
  assert.strictEqual(tabFromHash(''), 'treinos');
  assert.strictEqual(tabFromHash('#outra'), 'treinos');
});
