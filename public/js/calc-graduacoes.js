const DAY_MS = 1000 * 60 * 60 * 24;
const ZERO = Object.freeze({ years: 0, months: 0, days: 0 });

const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
};
const utcDay = ({ y, m, d }) => Date.UTC(y, m - 1, d);
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();

function addMonths({ y, m, d }, n) {
  const index = y * 12 + (m - 1) + n;
  const ny = Math.floor(index / 12);
  const nm = (index % 12) + 1;
  return { y: ny, m: nm, d: Math.min(d, daysInMonth(ny, nm)) };
}

export function calendarDiff(fromISO, toISO) {
  const from = parseISO(fromISO);
  const to = parseISO(toISO);
  if (utcDay(to) < utcDay(from)) return { ...ZERO };
  let months = (to.y - from.y) * 12 + (to.m - from.m);
  if (to.d < from.d) months -= 1;
  const anchor = addMonths(from, months);
  const days = Math.round((utcDay(to) - utcDay(anchor)) / DAY_MS);
  return { years: Math.floor(months / 12), months: months % 12, days };
}

const UNITS = [
  ['years', 'ano', 'anos'],
  ['months', 'mês', 'meses'],
  ['days', 'dia', 'dias'],
];

export function formatDuration(duration) {
  const parts = UNITS
    .filter(([key]) => duration[key] > 0)
    .slice(0, 2)
    .map(([key, one, many]) => `${duration[key]} ${duration[key] === 1 ? one : many}`);
  return parts.length ? parts.join(' e ') : 'hoje';
}

export function validGraduacoes(list) {
  return (list || [])
    .filter((g) => g && g.data && g.faixa)
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

function countTreinos(treinos, inicio, fim, inclusive) {
  if (treinos === null || treinos === undefined) return { treinos: null, horas: null };
  const inside = treinos.filter((t) => t.data && t.data >= inicio && (inclusive ? t.data <= fim : t.data < fim));
  const minutes = inside.reduce((sum, t) => sum + (t.duracaoMin || 0), 0);
  return { treinos: inside.length, horas: (minutes / 60).toFixed(1) };
}

export function buildTimeline(graduacoes, treinos, todayISO) {
  const marcos = validGraduacoes(graduacoes);
  return marcos.map((marco, i) => {
    const next = marcos[i + 1];
    const emAndamento = !next;
    const fim = next ? next.data : todayISO;
    return {
      marco,
      intervalo: {
        inicio: marco.data,
        fim,
        emAndamento,
        duracao: calendarDiff(marco.data, fim),
        ...countTreinos(treinos, marco.data, fim, emAndamento),
      },
    };
  });
}

export function journeySummary(graduacoes, treinos, todayISO) {
  const marcos = validGraduacoes(graduacoes);
  if (!marcos.length) return null;
  const first = marcos[0];
  const last = marcos[marcos.length - 1];
  const totals = countTreinos(treinos, first.data, todayISO, true);
  const faixaDesde = marcos.find((g) => g.faixa === last.faixa).data;
  return {
    faixa: last.faixa,
    grau: last.grau,
    faixaDesde,
    tempoNaFaixa: calendarDiff(faixaDesde, todayISO),
    tempoTotal: calendarDiff(first.data, todayISO),
    totalTreinos: totals.treinos,
    horas: totals.horas,
  };
}
