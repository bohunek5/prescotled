import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { series } from '../data/series.js';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(process.env.SITE_DIR || project);
const origin = new URL('https://bohunek5.github.io/prescotled/');
const expectedWarranty = {
  threeinone: 7, 'delux-pro': 7, 'delux-low-brightness': 7, 'delux-slim': 7,
  'delux-standard': 7, 'true-color': 7, 'delux-high-brightness': 7,
  onecut: 5, bread: 5, 'premium-dense': 5, 'premium-classic': 5,
  'premium-s-shape': 5, 'premium-rgbw': 5, cob: 3, 'cob-digital': 3,
};
const failures = [];
const pages = new Map();
let checkedLinks = 0;
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const visibleText = html => decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(match => [match[1].toLowerCase(), decode(match[3])]));
const check = (condition, message) => { if (!condition) failures.push(message); };
async function exists(file) { try { return (await stat(file)).isFile(); } catch { return false; } }

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || ['node_modules', 'scripts', 'docs', 'qa', 'output', 'dist'].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith('.html')) pages.set(file, await readFile(file, 'utf8'));
  }
}

function localTarget(value, from) {
  if (!value || /^(data:|blob:|mailto:|tel:|javascript:)/i.test(value)) return null;
  const sourceUrl = new URL(path.relative(root, from).split(path.sep).join('/'), origin);
  const url = new URL(value, sourceUrl);
  if (url.origin !== origin.origin) return null;
  // Fully qualified links to the existing site/configurator are deliberate external destinations.
  if (/^https?:\/\//i.test(value) && !url.pathname.startsWith(origin.pathname)) return null;
  check(url.pathname.startsWith(origin.pathname), `${path.relative(root, from)}: link escapes /prescotled/: ${value}`);
  if (!url.pathname.startsWith(origin.pathname)) return null;
  let relative = decodeURIComponent(url.pathname.slice(origin.pathname.length));
  if (!path.extname(relative)) relative += relative.endsWith('/') || !relative ? 'index.html' : '/index.html';
  return { file: path.join(root, relative), hash: url.hash.slice(1), url };
}

async function checkLink(value, from) {
  const target = localTarget(value, from);
  if (!target) return;
  checkedLinks++;
  check(await exists(target.file), `${path.relative(root, from)}: missing local destination ${value}`);
  if (target.hash && !target.hash.includes('=') && pages.has(target.file)) {
    const ids = [...pages.get(target.file).matchAll(/\bid\s*=\s*(["'])(.*?)\1/g)].map(match => match[2]);
    check(ids.includes(decodeURIComponent(target.hash)), `${path.relative(root, from)}: missing fragment ${value}`);
  }
}

assert.equal(series.length, 15, 'The own-brand tape catalogue must contain all 15 reviewed families.');
assert.equal(new Set(series.map(item => item.id)).size, 15, 'Series IDs must be unique.');
for (const item of series) {
  assert.equal(item.warrantyYears, expectedWarranty[item.id], `Incorrect warranty for ${item.name}`);
  assert.ok(item.description && item.paragraphs?.length >= 2, `Missing original series description for ${item.name}`);
  assert.ok(item.sourceUrl && item.warrantySource, `Missing documented source for ${item.name}`);
}
await walk(root);
check(pages.has(path.join(root, 'index.html')), 'Homepage is missing.');
for (const [file, html] of pages) {
  const label = path.relative(root, file);
  check(/<html\b[^>]*lang=["']pl["']/i.test(html), `${label}: missing Polish document language`);
  check((html.match(/<h1\b/gi) || []).length === 1, `${label}: expected one descriptive H1`);
  check(/<title>[^<]{12,}<\/title>/i.test(html), `${label}: missing descriptive title`);
  const tags = [...html.matchAll(/<(?:meta|link|a|img|script|video|source|iframe)\b[^>]*>/gi)].map(match => attrs(match[0]));
  const description = tags.find(tag => tag.name === 'description');
  check(description?.content?.length >= 60, `${label}: missing useful meta description`);
  const canonical = tags.find(tag => tag.rel === 'canonical')?.href;
  const expectedCanonical = new URL(label.replace(/index\.html$/, ''), origin).href;
  check(canonical === expectedCanonical, `${label}: canonical must be ${expectedCanonical}, got ${canonical}`);
  check(tags.some(tag => tag.property === 'og:title' && tag.content), `${label}: missing Open Graph title`);
  check(tags.some(tag => tag.property === 'og:image' && tag.content), `${label}: missing Open Graph image`);
  for (const tag of tags) {
    for (const attr of ['href', 'src', 'poster']) if (tag[attr]) await checkLink(tag[attr], file);
    if (tag.srcset) for (const candidate of tag.srcset.split(',')) await checkLink(candidate.trim().split(/\s+/)[0], file);
    if (tag.property === 'og:image' && tag.content) await checkLink(tag.content, file);
  }
  if (html.includes('<!-- SERIES_CARDS -->')) {
    const catalogue = html.match(/<!-- SERIES_CARDS -->([\s\S]*?)<!-- END_SERIES_CARDS -->/)?.[1] || '';
    check((catalogue.match(/class="series-card"/g) || []).length === 15, `${label}: catalogue build boundaries contain incomplete cards`);
  }
  check(!/<video\b[^>]*\bautoplay(?:\s|>|=)/i.test(html), `${label}: production video must wait for interaction`);
}

for (const item of series) {
  const file = path.join(root, 'serie', item.id, 'index.html');
  const html = pages.get(file);
  check(Boolean(html), `Missing directly accessible series page /serie/${item.id}/`);
  if (!html) continue;
  const text = visibleText(html);
  check(text.includes(item.name), `${item.id}: product name is missing`);
  check(text.includes(item.description), `${item.id}: series description is missing`);
  const warrantyRegion = html.match(/class=["'][^"']*detail-warranty[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  check(Boolean(warrantyRegion) && new RegExp(`\\b${item.warrantyYears}\\b`).test(visibleText(warrantyRegion || '')), `${item.id}: visible guarantee must show ${item.warrantyYears} years`);
  check(html.includes('https://bohunek5.github.io/prescotpl/konfigurator/'), `${item.id}: external configurator link missing`);
  if (item.configStrip) {
    const configLinks = [...html.matchAll(/\bhref\s*=\s*(["'])(.*?)\1/g)].map(match => decode(match[2])).filter(value => value.includes('#config='));
    check(configLinks.some(value => {
      try { return JSON.parse(decodeURIComponent(value.split('#config=')[1])).strip === item.configStrip; } catch { return false; }
    }), `${item.id}: configurator link does not preserve the chosen tape`);
  }
}

for (const name of ['style.css', 'app.js', 'preview.js', 'config.js']) {
  const file = path.join(root, name);
  if (!await exists(file)) { check(name !== 'style.css' && name !== 'app.js', `Required asset missing: ${name}`); continue; }
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/g)) await checkLink(match[1], file);
  for (const match of text.matchAll(/(?:from\s*|import\s*\(\s*)["'](\.[^"']+)["']/g)) await checkLink(match[1], file);
}

if (failures.length) {
  console.error(`Content checks failed (${failures.length}):\n${failures.map(message => `- ${message}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Content OK: ${pages.size} pages, 15 tape families (7 / 6 / 2 warranties), ${checkedLinks} local links, metadata and configurator deep links.`);
}
