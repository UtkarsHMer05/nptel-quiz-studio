(() => {
  const key = 'weekwise-theme-v1';
  const choices = ['system', 'light', 'dark'];
  const root = document.documentElement;
  const system = window.matchMedia?.('(prefers-color-scheme: dark)');
  let preference;

  function readPreference() {
    try {
      const saved = localStorage.getItem(key);
      return choices.includes(saved) ? saved : 'system';
    } catch {
      return 'system';
    }
  }

  function apply() {
    const theme = preference === 'system' ? (system?.matches ? 'dark' : 'light') : preference;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#111b17' : '#173e35';
    const selector = document.querySelector('#theme-select');
    if (selector) selector.value = preference;
  }

  function setPreference(value) {
    if (!choices.includes(value)) return;
    preference = value;
    try { localStorage.setItem(key, value); } catch {}
    apply();
  }

  preference = readPreference();
  window.weekwiseTheme = Object.freeze({get preference() { return preference; }, setPreference});
  const followSystem = () => { if (preference === 'system') apply(); };
  if (system?.addEventListener) system.addEventListener('change', followSystem);
  else system?.addListener?.(followSystem);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      preference = readPreference();
      apply();
    }
  });
  apply();
})();
