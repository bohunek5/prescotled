const root = document.documentElement;
const valid = value => value === 'day' || value === 'night';
const buttons = [...document.querySelectorAll('[data-set-theme]')];
const images = [...document.querySelectorAll('img[data-theme-day][data-theme-night]')];
let theme = valid(root.dataset.theme) ? root.dataset.theme : 'night';
let revision = 0;

function paint(next, persist = true) {
  if (!valid(next)) return;
  const changed = next !== theme;
  theme = next;
  const current = ++revision;
  root.dataset.theme = theme;
  root.style.colorScheme = theme === 'day' ? 'light' : 'dark';
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme === 'day' ? 'light' : 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'day' ? '#f3f3ed' : '#101112');
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.setTheme === theme)));
  if (persist) { try { localStorage.setItem('prescot-theme', theme); } catch {} }
  for (const img of images) {
    const src = img.dataset[theme === 'day' ? 'themeDay' : 'themeNight'];
    if (img.getAttribute('src') === src) continue;
    // Keep the current photograph visible until the other lighting is decoded.
    if (img.loading === 'lazy' && img.getBoundingClientRect().top > innerHeight * 1.6) {
      img.src = src;
      continue;
    }
    const nextImage = new Image(); nextImage.src = src;
    nextImage.decode().then(() => { if (current === revision) img.src = src; }).catch(() => {});
  }
  if (changed) dispatchEvent(new CustomEvent('prescot:themechange', {detail: {theme}}));
}

buttons.forEach(button => button.addEventListener('click', () => paint(button.dataset.setTheme)));
addEventListener('storage', event => { if (event.key === 'prescot-theme' && valid(event.newValue)) paint(event.newValue, false); });
addEventListener('pageshow', () => {
  let saved; try { saved = localStorage.getItem('prescot-theme'); } catch {}
  paint(valid(saved) ? saved : theme, false);
});
window.prescotTheme = {set: paint, get current() { return theme; }};
paint(theme, false);
