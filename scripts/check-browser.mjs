import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let playwright;
try { playwright = createRequire(path.join(project, 'package.json'))('playwright'); }
catch { playwright = createRequire(path.join(project, '..', 'prescotpl', 'package.json'))('playwright'); }
const base = new URL(process.env.BASE_URL || 'http://127.0.0.1:4186/');
const output = path.resolve(process.env.QA_DIR || path.join(project, 'qa', 'browser'));
await mkdir(output, { recursive: true });
const rows = [];
const jobs = process.env.TEST_WIDTH
  ? [{ engine: process.env.TEST_ENGINE || 'chromium', width: Number(process.env.TEST_WIDTH) }]
  : [320, 390, 768, 1024, 1440].map(width => ({ engine: 'chromium', width })).concat({ engine: 'webkit', width: 390 });

async function visibleCards(page, expected) {
  await page.waitForFunction(count => [...document.querySelectorAll('#series-grid .series-card')].filter(card => !card.hidden && getComputedStyle(card).display !== 'none').length === count, expected);
  assert.equal(await page.locator('#series-grid .series-card:visible').count(), expected);
}

async function assertLayout(page, stage) {
  const metrics = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return { width, scroll: document.documentElement.scrollWidth, body: document.body.scrollWidth };
  });
  assert.ok(metrics.scroll <= metrics.width + 1 && metrics.body <= metrics.width + 1, `${stage}: horizontal overflow ${JSON.stringify(metrics)}`);
}

async function run({ engine, width }) {
  const tag = `${engine}-${width}`;
  console.log(`Checking ${tag}…`);
  const browser = await playwright[engine].launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height: width < 641 ? 844 : 960 }, deviceScaleFactor: 1, isMobile: width < 641, hasTouch: width < 641 });
  const page = await context.newPage();
  page.setDefaultTimeout(18000);
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => {
    if (response.status() >= 400 && ['document', 'script', 'stylesheet', 'image', 'font'].includes(response.request().resourceType())) failedRequests.push(`${response.status()} ${response.url()}`);
  });
  const result = { engine, width, checks: [] };
  try {
    await page.goto(base.href, { waitUntil: 'domcontentloaded' });
    await visibleCards(page, 7);
    await page.locator('.hero-tape').evaluate(img => img.decode());
    await page.evaluate(() => document.fonts.ready);
    await assertLayout(page, 'Homepage');
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok(await page.locator('h1').innerText());
    assert.ok(await page.locator('#video-dialog video').evaluate(video => video.paused && video.currentTime === 0), 'Production video started before interaction');
    if (width === 390 || width === 1440) await page.screenshot({ path: path.join(output, `${tag}-home.png`), fullPage: true });
    result.checks.push('home, images, metadata, no horizontal overflow, video initially paused');

    const menu = page.locator('.menu-toggle');
    if (await menu.isVisible()) {
      assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      await menu.click();
      assert.equal(await menu.getAttribute('aria-expanded'), 'true');
      await page.locator('#site-nav a[href="#tasmy"]').click();
      await page.waitForFunction(() => document.querySelector('.menu-toggle')?.getAttribute('aria-expanded') === 'false');
    } else await page.locator('#site-nav a[href="#tasmy"]').click();
    result.checks.push('navigation and mobile menu');

    for (const [warranty, count] of [['5', 6], ['3', 2], ['all', 15], ['7', 7]]) {
      await page.locator(`[data-warranty="${warranty}"]`).click();
      await visibleCards(page, count);
      assert.equal(await page.locator(`[data-warranty="${warranty}"]`).getAttribute('aria-pressed'), 'true');
      await assertLayout(page, `Warranty ${warranty}`);
    }
    await page.locator('[data-warranty="all"]').click();
    await page.locator('#series-search').fill('rGbW');
    await visibleCards(page, 1);
    assert.match(await page.locator('#series-grid .series-card:visible').innerText(), /RGBW/);
    await page.locator('#series-search').fill('zzzz-no-such-series');
    await visibleCards(page, 0);
    assert.equal(await page.locator('#series-empty').isVisible(), true);
    await page.locator('#series-search').fill('');
    await visibleCards(page, 15);
    result.checks.push('warranty counts 7/6/2, case-insensitive search, empty state and reset');

    await page.locator('#component-viewer').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('#component-viewer')?.dataset.state === 'ready', null, { timeout: 60000 });
    assert.equal(await page.locator('#component-viewer canvas').count(), 1, 'Product viewer did not render its model');
    assert.equal(await page.locator('#component-models [data-model]').count(), 6);
    for (const watts of [36, 60, 100, 150, 200, 300]) {
      await page.locator(`#component-models button[data-model="pr-mad-${watts}"]`).click();
      assert.equal(await page.locator('#component-name').innerText(), `PR-MAD ${watts} W`);
      assert.match(await page.locator('#component-facts').innerText(), /3 lata/);
      assert.ok((await page.locator('#component-source').getAttribute('href')).endsWith(`pr-mad-${watts}w.pdf`));
      await page.waitForFunction(id => {
        const viewer = window.componentsDebug?.inspect()?.viewer;
        return viewer?.ready && viewer.id === id;
      }, `pr-mad-${watts}`);
    }
    for (const voltage of [24, 12]) {
      await page.locator(`[data-demo-voltage="${voltage}"]`).click();
      assert.equal(await page.locator('#voltage-value').innerText(), `${voltage} V`);
      assert.equal(await page.locator(`[data-demo-voltage="${voltage}"]`).getAttribute('aria-pressed'), 'true');
    }
    await page.locator('[data-component-type="controller"]').click();
    assert.equal(await page.locator('#component-models [data-model]').count(), 5);
    for (const [mode, swatches] of [['mono', ['Ciepła biel']], ['cct', ['Ciepła biel', 'Chłodna biel']], ['rgb', ['Czerwony', 'Niebieski', 'Fioletowy']], ['rgbw', null], ['rgbcct', null]]) {
      await page.locator(`#component-models button[data-model="pr-${mode}-12a"]`).click();
      assert.equal(await page.locator('#component-name').innerText(), `PR-${mode.toUpperCase()}-12A`);
      assert.match(await page.locator('#component-facts').innerText(), /2 lata/);
      assert.equal(await page.locator('#power-demo').isVisible(), false);
      assert.equal(await page.locator('#controller-demo').isVisible(), true);
      if (swatches) assert.deepEqual(await page.locator('[data-light-color]:visible').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label'))), swatches, `${mode}: controls expose unsupported colors`);
      await page.waitForFunction(id => {
        const viewer = window.componentsDebug?.inspect()?.viewer;
        return viewer?.ready && viewer.id === id;
      }, `pr-${mode}-12a`);
      await assertLayout(page, `${mode} controls`);
    }
    await page.locator('[data-light-color]:visible').last().click();
    assert.equal(await page.locator('[data-light-color]:visible').last().getAttribute('aria-pressed'), 'true');
    await page.waitForFunction(() => {
      const chosen = document.querySelector('[data-light-color][aria-pressed="true"]');
      const light = document.querySelector('.controlled-light i');
      return chosen && light && getComputedStyle(chosen).backgroundColor === getComputedStyle(light).backgroundColor;
    });
    await page.locator('#controller-brightness').focus();
    await page.locator('#controller-brightness').press('Home');
    await page.locator('#controller-brightness').press('ArrowRight');
    assert.equal(await page.locator('#controller-brightness-value').innerText(), '1%');
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.controlled-light i')).opacity) <= 0.011);
    await page.locator('#reset-product-view').click();
    if (width === 390 || width === 1440) await page.screenshot({ path: path.join(output, `${tag}-products.png`) });
    result.checks.push('six PR-MAD and five controller models, voltage example, mode-specific colors, dimming and model rendering');

    for (const [key, zone] of [['stairs', 'stair-under'], ['furniture', 'drawer'], ['kitchen', 'under']]) {
      await page.locator(`[data-application="${key}"]`).click();
      assert.equal(await page.locator(`[data-application="${key}"]`).getAttribute('aria-pressed'), 'true');
      const href = await page.locator('#application-config').getAttribute('href');
      const target = new URL(href, base);
      assert.equal(target.origin + target.pathname, 'https://bohunek5.github.io/prescotpl/konfigurator/');
      const state = JSON.parse(decodeURIComponent(target.hash.split('#config=')[1]));
      assert.equal(state.zone, zone);
      assert.equal(state.view, 'zone');
      assert.equal(state.light, true);
      await page.waitForFunction(expected => {
        const img = document.querySelector('#application-image');
        return img?.complete && img.naturalWidth > 0 && new URL(img.currentSrc).pathname.endsWith(expected);
      }, `application-${key}.webp`);
    }
    result.checks.push('kitchen, stairs and furniture carry their assembly into external configurator');

    await page.locator('#production-play').click();
    await page.waitForFunction(() => document.querySelector('#video-dialog')?.open);
    assert.equal(await page.locator('#video-dialog video').isVisible(), true, 'Production video should be visible in the open dialog');
    assert.equal(await page.locator('#video-dialog video').evaluate(video => video.controls), true, 'Production video should expose playback controls');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#video-dialog')?.open && document.querySelector('#video-dialog video')?.paused);
    assert.equal(await page.locator('#video-dialog video').evaluate(video => video.paused), true, 'Closing the video must stop playback');
    await page.locator('#production-play').click();
    await page.locator('#video-dialog .close-button').click();
    await page.waitForFunction(() => !document.querySelector('#video-dialog')?.open);
    result.checks.push('production dialog, Escape, close button and playback cleanup');

    if (width === 1440 || engine === 'webkit') {
      await page.locator('#film-play').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('#assembly-film')?.dataset.state === 'ready', null, { timeout: 60000 });
      if (await page.locator('#film-play').getAttribute('aria-pressed') !== 'true') await page.locator('#film-play').click();
      await page.waitForFunction(() => {
        const canvas = document.querySelector('#assembly-film canvas');
        return canvas && canvas.width > 100 && canvas.height > 100 && !document.querySelector('#assembly-film .film-loading:not([hidden])');
      }, null, { timeout: 60000 });
      await page.waitForFunction(() => /pauza|wstrzymaj|zatrzymaj/i.test(document.querySelector('#film-play')?.textContent || ''), null, { timeout: 15000 });
      await page.locator('#film-play').click();
      assert.match(await page.locator('#film-play').innerText(), /wznów|odtwórz|kontynuuj/i, 'Film should offer resuming after pausing');
      await page.screenshot({ path: path.join(output, `${tag}-assembly.png`) });
      await page.locator('#film-play').click();
      await page.waitForFunction(() => document.querySelector('#film-play')?.getAttribute('aria-pressed') === 'false' && /odtwórz|ponownie|jeszcze raz|powtórz/i.test(document.querySelector('#film-play')?.textContent || ''), null, { timeout: 15000 });
      result.checks.push('real assembly canvas loads, film pauses/resumes and completes');
    }

    for (const [id, name, years] of [['threeinone', 'DELUX 3 w 1', 7], ['premium-rgbw', 'Premium RGBW', 5], ['cob', 'Premium COB', 3]]) {
      await page.goto(new URL(`serie/${id}/`, base).href, { waitUntil: 'domcontentloaded' });
      await page.locator('h1').waitFor();
      assert.equal((await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim(), name);
      assert.match(await page.locator('.detail-warranty').innerText(), new RegExp(`\\b${years}\\b`));
      await assertLayout(page, `${name} detail`);
      assert.ok(await page.locator('a[href^="https://bohunek5.github.io/prescotpl/konfigurator/"]').count(), 'Missing external configurator CTA');
    }
    result.checks.push('direct series routes and correct visible 7/5/3 year guarantees');
    assert.deepEqual(failedRequests, [], 'Failed assets or pages');
    assert.deepEqual(errors, [], 'Browser JavaScript or console errors');
    result.status = 'pass';
    console.log(`${tag}: PASS (${result.checks.length} user paths)`);
  } catch (error) {
    result.status = 'fail';
    result.error = error.message;
    result.stack = error.stack;
    result.errors = errors;
    result.failedRequests = failedRequests;
    await page.screenshot({ path: path.join(output, `${tag}-failure.png`), fullPage: true }).catch(() => {});
    console.error(`${tag}: FAIL — ${error.message}`);
    process.exitCode = 1;
  } finally {
    rows.push(result);
    await writeFile(path.join(output, 'report.json'), JSON.stringify({ base: base.href, checkedAt: new Date().toISOString(), results: rows }, null, 2) + '\n');
    await context.close();
    await browser.close();
  }
}

for (const job of jobs) await run(job);
console.log(`Browser report: ${path.join(output, 'report.json')}`);
