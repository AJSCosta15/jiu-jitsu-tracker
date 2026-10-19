import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../public/js/dom.js';

test('escapeHtml escapa & < > " e aspas simples', () => {
  assert.equal(escapeHtml('<b>"A&B"</b>\''), '&lt;b&gt;&quot;A&amp;B&quot;&lt;/b&gt;&#39;');
});

test('escapeHtml devolve string vazia para null e undefined', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});
