(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('#themeToggle');
  const update = () => {
    const dark = root.dataset.theme === 'dark';
    toggle.innerHTML = `<i data-lucide="${dark ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    toggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
    toggle.title = toggle.getAttribute('aria-label');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#15191d' : '#f8fafb';
    lucide.createIcons();
  };
  toggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('upcast-theme', root.dataset.theme); } catch (_) { /* Private sessions may deny storage. */ }
    update();
  });
  update();
  const film = document.querySelector('#overviewFilm');
  document.querySelectorAll('[data-film-chapter]').forEach(button => button.addEventListener('click', async () => {
    try {
      const chapters = window.UPCAST_FILM_CHAPTERS;
      const chapter = chapters[Number(button.dataset.filmChapter)];
      const seek = () => { film.currentTime = chapter.start; film.play().catch(() => {}); };
      if (film.readyState >= 1) seek();
      else { film.addEventListener('loadedmetadata', seek, { once: true }); film.load(); }
    } catch (_) { film.play().catch(() => {}); }
  }));
})();
