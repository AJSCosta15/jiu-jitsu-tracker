const DAY_MS = 1000 * 60 * 60 * 24;
const ALL = 'Todos';
const MONTHS = 12;

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const inYear = (treino, year) => (treino.data || '').startsWith(String(year));

export function filterTreinos(treinos, { year, month, modality }) {
  return treinos.filter((t) => {
    if (year !== ALL && !inYear(t, year)) return false;
    if (month !== ALL) {
      const parts = (t.data || '').split('-');
      if (!t.data || parts[1] !== month) return false;
    }
    return modality === ALL || t.modalidade === modality;
  });
}

export function goalYearTreinos(treinos, yearFilter, now) {
  const targetYear = yearFilter === ALL ? now.getFullYear() : parseInt(yearFilter, 10);
  return { targetYear, list: treinos.filter((t) => inYear(t, targetYear)) };
}

function yearProgress(targetYear, now) {
  const totalDays = isLeap(targetYear) ? 366 : 365;
  const currentYear = now.getFullYear();
  if (targetYear < currentYear) return { totalDays, daysPassed: totalDays, remainingWeeks: 0 };
  if (targetYear > currentYear) return { totalDays, daysPassed: 0, remainingWeeks: 52.14 };
  const ms = now.getTime() - new Date(targetYear, 0, 1).getTime();
  const daysPassed = Math.max(1, Math.floor(ms / DAY_MS));
  return { totalDays, daysPassed, remainingWeeks: Math.max(0.1, (totalDays - daysPassed) / 7) };
}

export function computeGoal(count, targetYear, now, goal = 130) {
  const { totalDays, daysPassed, remainingWeeks } = yearProgress(targetYear, now);
  const goalReached = count >= goal;
  const projection = daysPassed > 0 ? (count / daysPassed) * totalDays : null;
  const weeklyRequired = !goalReached && remainingWeeks > 0 ? (goal - count) / remainingWeeks : null;
  return {
    percent: Math.round((count / goal) * 100),
    ringFraction: count / goal,
    paceDiff: count - (goal / totalDays) * daysPassed,
    projection,
    projFraction: projection === null ? null : projection / goal,
    weeklyRequired,
    goalReached,
  };
}

const typeCount = (treinos, ...names) => treinos.filter((t) => names.includes(t.tipo)).length;

export function computeKpis(treinos) {
  const total = treinos.length;
  const totalMinutes = treinos.reduce((sum, t) => sum + (t.duracaoMin || 0), 0);
  const monthCounts = Array(MONTHS).fill(0);
  treinos.forEach((t) => {
    if (t.data) monthCounts[new Date(`${t.data}T00:00:00`).getMonth()] += 1;
  });
  return {
    total,
    avgMinutes: total > 0 ? Math.round(totalMinutes / total) : 0,
    hours: (totalMinutes / 60).toFixed(1),
    highIntensity: treinos.filter((t) => t.intensidade === 'Alta').length,
    gi: treinos.filter((t) => t.modalidade === 'Gi').length,
    nogi: treinos.filter((t) => t.modalidade === 'No-Gi' || t.modalidade === 'No Gi').length,
    monthCounts,
    donut: [
      typeCount(treinos, 'Técnica'),
      typeCount(treinos, 'Sparring', 'Sparring / Rolagem'),
      typeCount(treinos, 'Seminário'),
    ],
  };
}
