export const TABS = ['treinos', 'graduacoes'];

export const tabFromHash = (hash) => (hash === '#graduacoes' ? 'graduacoes' : 'treinos');

export function activateTab(name) {
  TABS.forEach((tab) => {
    const active = tab === name;
    const button = document.getElementById(`tab-${tab}`);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    document.getElementById(`panel-${tab}`).hidden = !active;
  });
}

function selectTab(name, focus) {
  if (location.hash !== `#${name}`) location.hash = name;
  activateTab(name);
  if (focus) document.getElementById(`tab-${name}`).focus();
}

function onKeydown(event) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  const current = TABS.indexOf(tabFromHash(location.hash));
  const step = event.key === 'ArrowRight' ? 1 : -1;
  selectTab(TABS[(current + step + TABS.length) % TABS.length], true);
}

export function initTabs() {
  TABS.forEach((tab) => {
    const button = document.getElementById(`tab-${tab}`);
    button.addEventListener('click', () => selectTab(tab, false));
    button.addEventListener('keydown', onKeydown);
  });
  window.addEventListener('hashchange', () => activateTab(tabFromHash(location.hash)));
  activateTab(tabFromHash(location.hash));
}
