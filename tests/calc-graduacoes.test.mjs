import test from 'node:test';
import assert from 'node:assert';
import {
  calendarDiff, formatDuration, validGraduacoes, buildTimeline, journeySummary,
} from '../public/js/calc-graduacoes.js';

const grad = (id, data, faixa, grau) => ({ id, titulo: id, data, faixa, grau, academia: '', professor: '', observacoes: '' });
const treino = (data, duracaoMin) => ({ id: data, nome: 't', data, duracaoMin, modalidade: '', tipo: '', intensidade: '', foco: '' });

const GRADS = [
  grad('g1', '2025-08-04', 'Branca', 'Início'),
  grad('g2', '2025-12-01', 'Branca', '1º Grau'),
  grad('g3', '2026-03-13', 'Branca', '2º Grau'),
  grad('g4', '2026-10-18', 'Azul', 'Início'),
];

test('calendarDiff usa calendario real', () => {
  assert.deepStrictEqual(calendarDiff('2025-08-04', '2025-12-01'), { years: 0, months: 3, days: 27 });
  assert.deepStrictEqual(calendarDiff('2025-12-01', '2026-03-13'), { years: 0, months: 3, days: 12 });
  assert.deepStrictEqual(calendarDiff('2026-01-31', '2026-02-28'), { years: 0, months: 0, days: 28 });
});

test('calendarDiff nunca devolve negativos ou NaN', () => {
  const d = calendarDiff('2024-02-29', '2025-02-28');
  Object.values(d).forEach((v) => assert.ok(Number.isInteger(v) && v >= 0));
  assert.deepStrictEqual(calendarDiff('2026-05-01', '2026-04-01'), { years: 0, months: 0, days: 0 });
});

test('formatDuration mostra as duas maiores unidades', () => {
  assert.strictEqual(formatDuration({ years: 0, months: 3, days: 27 }), '3 meses e 27 dias');
  assert.strictEqual(formatDuration({ years: 1, months: 2, days: 5 }), '1 ano e 2 meses');
  assert.strictEqual(formatDuration({ years: 0, months: 0, days: 1 }), '1 dia');
  assert.strictEqual(formatDuration({ years: 0, months: 0, days: 0 }), 'hoje');
});

test('validGraduacoes descarta itens incompletos e ordena por data', () => {
  const list = [GRADS[2], grad('x', '', 'Azul', ''), grad('y', '2026-01-01', '', ''), GRADS[0]];
  assert.deepStrictEqual(validGraduacoes(list).map((g) => g.id), ['g1', 'g3']);
});

test('buildTimeline conta treinos por intervalo semiaberto', () => {
  const tl = buildTimeline(GRADS, [treino('2025-12-01', 60), treino('2025-11-30', 90), treino('', 30)], '2026-10-19');
  assert.strictEqual(tl[0].intervalo.treinos, 1);
  assert.strictEqual(tl[0].intervalo.horas, '1.5');
  assert.strictEqual(tl[1].intervalo.treinos, 1);
  assert.strictEqual(tl[1].intervalo.emAndamento, false);
});

test('buildTimeline: ultimo intervalo inclui hoje e esta em andamento', () => {
  const tl = buildTimeline(GRADS, [treino('2026-10-19', 60)], '2026-10-19');
  const last = tl[tl.length - 1].intervalo;
  assert.strictEqual(last.emAndamento, true);
  assert.strictEqual(last.treinos, 1);
  assert.deepStrictEqual(last.duracao, { years: 0, months: 0, days: 1 });
});

test('buildTimeline sem treinos devolve null', () => {
  const tl = buildTimeline(GRADS, null, '2026-10-19');
  assert.strictEqual(tl[0].intervalo.treinos, null);
  assert.strictEqual(tl[0].intervalo.horas, null);
});

test('journeySummary resume a jornada', () => {
  const grads = [...GRADS, grad('g5', '2027-03-01', 'Azul', '1º Grau')];
  const s = journeySummary(grads, [treino('2025-08-04', 60), treino('2025-08-01', 60)], '2027-03-03');
  assert.strictEqual(s.faixa, 'Azul');
  assert.strictEqual(s.grau, '1º Grau');
  assert.strictEqual(s.faixaDesde, '2026-10-18');
  assert.strictEqual(s.totalTreinos, 1);
  assert.strictEqual(s.horas, '1.0');
  assert.deepStrictEqual(s.tempoNaFaixa, { years: 0, months: 4, days: 13 });
  assert.strictEqual(journeySummary(GRADS, null, '2026-10-19').totalTreinos, null);
});

test('journeySummary sem marcos validos devolve null', () => {
  assert.strictEqual(journeySummary([], [], '2026-10-19'), null);
});
