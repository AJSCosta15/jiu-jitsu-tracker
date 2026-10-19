const test = require('node:test');
const assert = require('node:assert');
const { normalizeTreino, normalizeGraduacao } = require('../lib/normalize');

test('normalizeTreino extrai campos usados pelo painel', () => {
  const page = { id: 'p1', properties: {
    'Treino': { title: [{ plain_text: 'Treino 72' }] },
    'Data': { date: { start: '2026-04-10' } },
    'Duração (min)': { number: 90 },
    'Modalidade': { select: { name: 'Gi' } },
    'Tipo': { select: { name: 'Técnica' } },
    'Intensidade': { select: { name: 'Alta' } },
    'Foco do Treino': { rich_text: [{ plain_text: 'Passagem' }] },
  }};
  assert.deepStrictEqual(normalizeTreino(page), { id: 'p1', nome: 'Treino 72', data: '2026-04-10',
    duracaoMin: 90, modalidade: 'Gi', tipo: 'Técnica', intensidade: 'Alta', foco: 'Passagem' });
});

test('normalizeTreino com propriedades vazias usa padrões', () => {
  assert.deepStrictEqual(normalizeTreino({ id: 'p2', properties: {} }), { id: 'p2', nome: 'Treino (Sem nome)',
    data: '', duracaoMin: 0, modalidade: '', tipo: '', intensidade: '', foco: '' });
});

test('normalizeGraduacao extrai marco da graduação', () => {
  const page = { id: 'g1', properties: {
    'Graduação': { title: [{ plain_text: 'Faixa Azul' }] },
    'Data': { date: { start: '2026-10-18' } },
    'Faixa': { select: { name: 'Azul' } },
    'Grau': { select: { name: 'Sem grau' } },
    'Academia / Evento': { rich_text: [{ plain_text: 'Diego Nery Jiu-Jitsu' }] },
    'Professor': { rich_text: [{ plain_text: 'Rick Dias' }] },
    'Observações': { rich_text: [{ plain_text: 'Primeiro ' }, { plain_text: 'dia' }] },
  }};
  assert.deepStrictEqual(normalizeGraduacao(page), { id: 'g1', titulo: 'Faixa Azul', data: '2026-10-18',
    faixa: 'Azul', grau: 'Sem grau', academia: 'Diego Nery Jiu-Jitsu', professor: 'Rick Dias', observacoes: 'Primeiro dia' });
});

test('normalizeGraduacao com propriedades vazias usa padrões', () => {
  assert.deepStrictEqual(normalizeGraduacao({ id: 'g2', properties: {} }), { id: 'g2', titulo: '',
    data: '', faixa: '', grau: '', academia: '', professor: '', observacoes: '' });
});
