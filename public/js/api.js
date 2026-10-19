async function getJson(path, refresh) {
  const resp = await fetch(refresh ? `${path}?refresh=1` : path);
  return resp.json();
}

export const fetchTreinos = (refresh = false) => getJson('/api/treinos', refresh);
export const fetchGraduacoes = (refresh = false) => getJson('/api/graduacoes', refresh);
