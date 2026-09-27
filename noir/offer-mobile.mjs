// Phone controls reuse the existing series buttons and renderer state.
const root = document.querySelector('[data-evo-series-preview]');
if (root) {
  const phone = matchMedia('(max-width: 760px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const rail = root.querySelector('.evolution-stops');
  const buttons = [...rail.querySelectorAll('[data-evo-jump]')];
  const art = root.querySelector('.evolution-art');
  const readout = root.querySelector('.evolution-readout');
  const anchor = document.createComment('Desktop model parameters');
  readout.before(anchor);
  const theme = document.querySelector('.theme-switcher');
  const themeAnchor = document.createComment('Desktop theme controls');
  theme.before(themeAnchor);
  const controls = document.createElement('div');
  controls.className = 'mobile-series-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Wybór serii taśmy');
  controls.innerHTML = '<button type="button" data-series-prev aria-label="Poprzednia seria taśmy">←</button><span>Przesuń, by zmienić serię <b data-series-count>01 / 14</b></span><button type="button" data-series-next aria-label="Następna seria taśmy">→</button>';
  const details = document.createElement('details');
  details.className = 'mobile-series-specs';
  details.innerHTML = '<summary>Parametry tej taśmy <span aria-hidden="true">+</span></summary>';
  const selected = () => Math.max(0, buttons.findIndex(b => b.getAttribute('aria-current') === 'step'));
  const step = direction => buttons[(selected() + direction + buttons.length) % buttons.length].click();
  controls.querySelector('[data-series-prev]').addEventListener('click', () => step(-1));
  controls.querySelector('[data-series-next]').addEventListener('click', () => step(1));
  function sync() {
    if (!phone.matches) return;
    const index = selected(), button = buttons[index];
    controls.querySelector('[data-series-count]').textContent = `${String(index + 1).padStart(2, '0')} / ${buttons.length}`;
    const r = rail.getBoundingClientRect(), b = button.getBoundingClientRect();
    if (b.left < r.left || b.right > r.right) rail.scrollTo({left: rail.scrollLeft + b.left - r.left - (r.width - b.width) / 2, behavior: reduced.matches ? 'instant' : 'smooth'});
  }
  new MutationObserver(sync).observe(rail, {subtree: true, attributes: true, attributeFilter: ['aria-current']});
  let start = null;
  art.addEventListener('pointerdown', event => {
    if (phone.matches && event.isPrimary && event.pointerType !== 'mouse') start = {x: event.clientX, y: event.clientY};
  }, {passive: true});
  art.addEventListener('pointercancel', () => {start = null;}, {passive: true});
  art.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, {passive: true});
  function layout() {
    if (phone.matches) {
      document.querySelector('.header-actions .menu-toggle').before(theme);
      root.querySelector('.evolution-pair').after(controls);
      root.querySelector('.evolution-stage').append(details);
      details.append(readout);
      sync();
    } else {
      themeAnchor.after(theme);
      anchor.after(readout);
      details.remove();
      controls.remove();
    }
  }
  phone.addEventListener('change', layout);
  layout();
}
