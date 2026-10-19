import test from 'node:test';
import assert from 'node:assert/strict';
import { filterTreinos, goalYearTreinos, computeGoal, computeKpis } from '../public/js/calc-treinos.js';

const t = (o) => ({ id: 'x', nome: 'n', data: '', duracaoMin: 0, modalidade: '', tipo: '', intensidade: '', foco: '', ...o });
const treinos = [
  t({ duracaoMin: 60, modalidade: 'Gi', tipo: 'Técnica', intensidade: 'Alta', data: '2026-01-05' }),
  t({ duracaoMin: 90, modalidade: 'No Gi', tipo: 'Sparring / Rolagem', intensidade: 'Média', data: '2026-02-01' }),
  t({ duracaoMin: 30 }),
];
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('computeGoal no meio do ano', () => {
  const g = computeGoal(65, 2026, new Date(2026, 6, 2), 130);
  assert.equal(g.percent, 50);
  near(g.projection, (65 / 182) * 365);
  near(g.weeklyRequired, (130 - 65) / ((365 - 182) / 7));
  assert.equal(g.goalReached, false);
});

test('computeGoal de ano passado', () => {
  const g = computeGoal(10, 2025, new Date(2026, 0, 10));
  assert.equal(g.weeklyRequired, null);
  assert.equal(g.goalReached, false);
  assert.equal(g.projection, 10);
});

test('computeGoal com meta superada', () => {
  const g = computeGoal(140, 2026, new Date(2026, 6, 2));
  assert.equal(g.goalReached, true);
  near(g.ringFraction, 140 / 130);
});

test('computeKpis agrega corretamente', () => {
  const k = computeKpis(treinos);
  assert.equal(k.total, 3);
  assert.equal(k.avgMinutes, 60);
  assert.equal(k.hours, '3.0');
  assert.equal(k.highIntensity, 1);
  assert.equal(k.gi, 1);
  assert.equal(k.nogi, 1);
  assert.ok(k.monthCounts[0] === 1 && k.monthCounts[1] === 1);
  assert.deepEqual(k.donut, [1, 1, 0]);
});

test('filterTreinos por ano e mês', () => {
  const r = filterTreinos(treinos, { year: '2026', month: '02', modality: 'Todos' });
  assert.equal(r.length, 1);
  assert.equal(r[0].data, '2026-02-01');
});

test('filterTreinos exclui sem data quando há filtro de mês', () => {
  assert.equal(filterTreinos(treinos, { year: 'Todos', month: '01', modality: 'Todos' }).length, 1);
  assert.equal(filterTreinos(treinos, { year: 'Todos', month: 'Todos', modality: 'Todos' }).length, 3);
});

test('goalYearTreinos usa ano corrente com Todos', () => {
  const r = goalYearTreinos(treinos, 'Todos', new Date(2026, 5, 1));
  assert.equal(r.targetYear, 2026);
  assert.equal(r.list.length, 2);
});
