const prop = (page, name) => (page && page.properties && page.properties[name]) || {};

const titleText = (page, name, fallback) => {
  const first = (prop(page, name).title || [])[0];
  return (first && first.plain_text) || fallback;
};

const selectName = (page, name) => {
  const sel = prop(page, name).select;
  return (sel && sel.name) || '';
};

const dateStart = (page, name) => {
  const date = prop(page, name).date;
  return (date && date.start) || '';
};

const firstRichText = (page, name) => {
  const first = (prop(page, name).rich_text || [])[0];
  return (first && first.plain_text) || '';
};

const joinedRichText = (page, name) =>
  (prop(page, name).rich_text || []).map((t) => t.plain_text || '').join('');

const normalizeTreino = (page) => ({
  id: page.id,
  nome: titleText(page, 'Treino', 'Treino (Sem nome)'),
  data: dateStart(page, 'Data'),
  duracaoMin: prop(page, 'Duração (min)').number || 0,
  modalidade: selectName(page, 'Modalidade'),
  tipo: selectName(page, 'Tipo'),
  intensidade: selectName(page, 'Intensidade'),
  foco: firstRichText(page, 'Foco do Treino'),
});

const normalizeGraduacao = (page) => ({
  id: page.id,
  titulo: titleText(page, 'Graduação', ''),
  data: dateStart(page, 'Data'),
  faixa: selectName(page, 'Faixa'),
  grau: selectName(page, 'Grau'),
  academia: joinedRichText(page, 'Academia / Evento'),
  professor: joinedRichText(page, 'Professor'),
  observacoes: joinedRichText(page, 'Observações'),
});

module.exports = { normalizeTreino, normalizeGraduacao };
