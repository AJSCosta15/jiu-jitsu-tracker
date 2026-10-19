import { escapeHtml } from './dom.js';

const FAIXAS = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta'];
const MAX_STRIPES = 4;

const slugify = (text) => String(text || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .trim().toLowerCase();

export function beltModel(faixa, grau) {
  const slug = FAIXAS.includes(slugify(faixa)) ? slugify(faixa) : 'desconhecida';
  const match = /^(\d+)/.exec(String(grau || '').trim());
  const stripes = match ? Math.min(Number(match[1]), MAX_STRIPES) : 0;
  return { slug, stripes, tip: slug === 'preta' ? 'red' : 'black' };
}

export function beltHtml(faixa, grau, size = '') {
  const { slug, stripes, tip } = beltModel(faixa, grau);
  const label = escapeHtml(`Faixa ${faixa || '?'} · ${grau || 'Sem grau'}`);
  const marks = '<span class="belt-stripe"></span>'.repeat(stripes);
  const sizeClass = size ? ` belt--${size}` : '';
  return `<span class="belt belt--${slug}${sizeClass}" role="img" aria-label="${label}">`
    + `<span class="belt-tip belt-tip--${tip}">${marks}</span></span>`;
}
