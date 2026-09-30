(() => {
  let stored;
  try { stored = localStorage.getItem('upcast-theme'); } catch (_) { /* Storage can be disabled. */ }
  document.documentElement.dataset.theme = stored === 'dark' || stored === 'light' ? stored : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();
