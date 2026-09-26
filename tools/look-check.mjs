#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════
   NOVA look check — "the identity is really on the screen"

   The visual identity (docs/05-design-tokens.md, the AURA generation)
   lives in tokens: ink base · light edges · pills + squircles · one
   aurora pair. A token nobody reads is a screenshot nobody sees, so
   this harness boots the real prototype in jsdom — with every
   stylesheet injected — and proves:

     · the AURA home renders its four bands (sky · ask · cards · shelf)
     · the icon grid is GONE: one orbit shelf holds every app, no pages,
       no dots, and the dock still carries the top four + «الكل»
     · the identity tokens resolve to the AURA values in the live DOM
     · the identity rules exist in look.css (pills, squircles, the
       light edge, the gradient faces)
     · nothing references the deleted iOS sheets any more
     · SPACES really filters the shelf, and «الكل» restores it
     · NOVA Paper (light) switches the base to warm paper
     · the app icon is the AURA mark, and every brand mark shows it

   usage:  node tools/look-check.mjs
   ══════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../prototype');

let passed = 0;
let failed = 0;
const results = [];
function check(name, ok, extra = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
  ok ? passed++ : failed++;
}

/* ── boot the real app, with the real stylesheets ─────────────── */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readdirSync(path.join(ROOT, 'styles'))
  .filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(path.join(ROOT, 'styles', f), 'utf8'))
  .join('\n');
const dom = new JSDOM(html.replace('</head>', `<style>${css}</style></head>`), {
  url: 'http://localhost:8080/', pretendToBeVisual: true,
});
const { window } = dom;
const g = globalThis;
g.window = window;
g.document = window.document;
g.HTMLElement = window.HTMLElement;
g.Element = window.Element;
g.Node = window.Node;
g.CustomEvent = window.CustomEvent;
g.Event = window.Event;
g.PointerEvent = window.PointerEvent;
g.MouseEvent = window.MouseEvent;
g.KeyboardEvent = window.KeyboardEvent;
g.getComputedStyle = window.getComputedStyle.bind(window);
g.requestAnimationFrame = window.requestAnimationFrame.bind(window);
g.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
const mm = (q) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {} });
window.matchMedia = mm;
g.matchMedia = mm;
window.HTMLCanvasElement.prototype.getContext = () => null;
Object.defineProperty(g, 'navigator', { value: window.navigator, configurable: true });
g.location = window.location;
g.history = window.history;
g.localStorage = window.localStorage;
g.innerWidth = 390;
g.innerHeight = 844;
Object.defineProperty(window.navigator, 'getBattery', {
  value: async () => ({ level: 0.64, charging: false, addEventListener() {} }), configurable: true,
});

const errors = [];
const origErr = console.error;
console.error = (...a) => { errors.push(a.join(' ')); };

await import(`file://${ROOT}/src/main.js`);
await new Promise((r) => setTimeout(r, 400));

const d = window.document;
const q = (s) => d.querySelector(s);
const qa = (s) => [...d.querySelectorAll(s)];
const cs = (el) => (el ? window.getComputedStyle(el) : null);
/* jsdom resolves body-declared custom properties on <body> and :root ones on
   <html>: read both so the check never depends on where a token lives. */
const tok = (name) => cs(d.body).getPropertyValue(name).trim()
  || cs(d.documentElement).getPropertyValue(name).trim();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── 1 · the AURA home ───────────────────────────────────────── */
check('home renders', !!q('#layer-home .home'));
check('the sky band carries the clock + greeting + date',
  /\d{1,2}:\d{2}/.test(q('.home__time')?.textContent || '')
  && !!q('.home__hello') && !!q('.home__date'), q('.home__time')?.textContent);
check('SPACES chips row', qa('.home__space').length === 4, String(qa('.home__space').length));
check('the ask bar is the hero of the screen',
  !!q('.home__ask') && (q('.home__ask').textContent || '').includes('عايز تعمل إيه؟'));
check('live cards are produced by state', qa('.home__card').length >= 2, String(qa('.home__card').length));

/* ── 2 · the icon grid is gone ───────────────────────────────── */
const rail = q('.home__rail');
const railIcons = qa('.home__rail .home__icon');
check('one orbit shelf holds EVERY app', railIcons.length === 43, `${railIcons.length}/43`);
check('no pages, no dots — the shelf scrolls instead of paging',
  qa('.home__page, .home__dots, .home__dot').length === 0);
check('the shelf is a horizontal scroller', cs(rail).overflowX === 'auto', cs(rail).overflowX);
check('the shelf snaps', /mandatory/.test(cs(rail).scrollSnapType || ''), cs(rail).scrollSnapType);
check('the dock still carries the top four', qa('.home__dock .home__icon').length === 4);
check('the dock ends with a door to every app', !!q('.home__all'));
check('every shelf icon is a morph source (data-app)', railIcons.every((el) => !!el.dataset.app));

/* ── 3 · the identity tokens resolve in the live DOM ─────────── */
check('ink base (not black)', tok('--nv-bg') === '#08090F', tok('--nv-bg'));
check('the aurora pair: indigo + mint',
  tok('--nv-accent') === '#7c6cff' && tok('--nv-accent-2') === '#5eead4',
  `${tok('--nv-accent')} / ${tok('--nv-accent-2')}`);
check('chips are pills', tok('--nv-r-chip') === '999px', tok('--nv-r-chip'));
check('app icons are squircles', tok('--nv-r-app') === '30%', tok('--nv-r-app'));
check('panels are deeply rounded', tok('--nv-r-panel') === '38px', tok('--nv-r-panel'));
check('the display type scale grew', tok('--nv-text-display') === '46px', tok('--nv-text-display'));
check('depth = a light edge + an accent glow',
  !!tok('--nv-edge') && !!tok('--nv-glow'), `${tok('--nv-edge').slice(0, 22)}…`);

/* ── 4 · the identity rules exist in the sheet ───────────────── */
const look = fs.readFileSync(path.join(ROOT, 'styles', 'look.css'), 'utf8');
check('look.css owns the home surface', look.includes('.home__ask') && look.includes('.home__rail'));
check('the ask bar is a full pill', /\.home__ask\s*{[^}]*border-radius:\s*var\(--nv-r-chip\)/s.test(look));
check('icon faces are gradient squircles',
  /\.home__icon-face\s*{[^}]*border-radius:\s*var\(--nv-r-app\)/s.test(look)
  && /\.home__icon-face\s*{[^}]*radial-gradient/s.test(look));
check('glass surfaces carry the light edge', (look.match(/var\(--nv-edge\)/g) || []).length >= 8,
  String((look.match(/var\(--nv-edge\)/g) || []).length));
check('depth is accent-tinted, never a black slab', /0 0 120px -30px var\(--nv-glow\)/.test(look));
check('the AURA wallpaper is a mesh, not a flat fill',
  /\.wallpaper\s*{[^}]*radial-gradient[^}]*radial-gradient/s.test(look));
check('the lock clock is thin and huge', /\.lock__clock\s*{[^}]*font-weight:\s*200/s.test(look));

/* ── 5 · the iOS-conversion sheets are really gone ───────────── */
check('index.html loads look.css and no iOS sheet',
  /styles\/look\.css/.test(html) && !/ios-(home|system)\.css/.test(html));
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
check('the offline shell precaches look.css', sw.includes("'./styles/look.css'")
  && !/ios-(home|system)\.css/.test(sw));
check('no source file references the deleted sheets',
  !fs.readdirSync(path.join(ROOT, 'src'), { recursive: true })
    .filter((f) => String(f).endsWith('.js'))
    .some((f) => /ios-(home|system)/.test(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'))));

/* ── 6 · SPACES really filters ───────────────────────────────── */
const chipOf = (id) => qa('.home__space').find((b) => b.dataset.space === id);
chipOf('work')?.click();
await wait(150);
check('a space narrows the shelf to its apps', railIcons.length !== qa('.home__rail .home__icon').length
  && qa('.home__rail .home__icon').length === 14, String(qa('.home__rail .home__icon').length));
chipOf('travel')?.click();
await wait(150);
check('سفر is its own space', qa('.home__rail .home__icon').length === 10, String(qa('.home__rail .home__icon').length));
chipOf('all')?.click();
await wait(150);
check('الكل restores every app', qa('.home__rail .home__icon').length === 43);

/* ── 7 · NOVA Paper keeps its own identity ───────────────────── */
const modeChip = qa('#chips-mode .chip')[1];
modeChip?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(200);
check('NOVA Paper switches to warm paper',
  d.body.dataset.mode === 'light' && tok('--nv-bg') === '#F6F4EF', tok('--nv-bg'));
qa('#chips-mode .chip')[0]?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await wait(200);
check('back to NOVA Dark ink', tok('--nv-bg') === '#08090F', tok('--nv-bg'));

/* ── 8 · the app icon is the AURA mark ───────────────────────── */
const REPO = path.resolve(ROOT, '..');
const icons = path.join(ROOT, 'icons');
const exists = (f) => fs.existsSync(f);
const iconScript = () => fs.readFileSync(path.join(REPO, 'tools', 'make-app-icon.sh'), 'utf8');

for (const f of ['nova-icon-source.png', 'icon-192.png', 'icon-512.png',
                 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png']) {
  check(`icons/${f} exists`, exists(path.join(icons, f)));
}
for (const dpi of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  const dir = path.join(REPO, 'android/app/src/main/res', `mipmap-${dpi}`);
  check(`android mipmap-${dpi} carries launcher + adaptive layers`,
    ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_background.png',
     'ic_launcher_foreground.png'].every((f) => exists(path.join(dir, f))));
}
check('the mark is drawn from the AURA values',
  /INK='#08090F'/.test(iconScript()) && /INDIGO='#7C6CFF'/.test(iconScript())
  && /MINT='#5EEAD4'/.test(iconScript()));
check('the icon is a squircle plate (radius 30 %)', /R=\$\(\( S \* 30 \/ 100 \)\)/.test(iconScript()));
check('the ring passes in front of the orb', /ring-front\.png/.test(iconScript())
  && /ARC_FRONT=/.test(iconScript()));
check('make-icons.sh still regenerates the set',
  fs.readFileSync(path.join(REPO, 'tools', 'make-icons.sh'), 'utf8')
    .includes('make-app-icon.sh'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
check('the PWA manifest paints AURA ink',
  manifest.background_color === '#08090F' && manifest.theme_color === '#08090F',
  `${manifest.background_color} / ${manifest.theme_color}`);
const stat = fs.readFileSync(path.join(REPO, 'android/app/src/main/res/drawable/ic_nova_stat.xml'), 'utf8');
check('the status-bar glyph is the same mark',
  exists(path.join(REPO, 'android/app/src/main/res/drawable/ic_nova_stat.xml'))
  /* far arc → orb → near arc, so the ring crosses the planet in one colour too */
  && stat.indexOf('M3.8,13.4 A 8.2,2.9 0 0 1 20.2,13.4') < stat.indexOf('M12,6.6a5.4,5.4')
  && stat.indexOf('M20.2,13.4 A 8.2,2.9 0 0 1 3.8,13.4') > stat.indexOf('M12,6.6a5.4,5.4'));
check('every brand mark carries the icon as a squircle',
  /\.deck__logo img[^}]*border-radius:\s*30%/s.test(look)
  && /\.setup__logo\s*\{[^}]*border-radius:\s*30%/s.test(look));

check('no runtime errors while booting the new look', errors.length === 0, errors.slice(0, 2).join('; '));
console.error = origErr;

console.log('NOVA look check — tools/look-check.mjs');
console.log('──────────────────────────────────────────');
console.log(results.join('\n'));
console.log('──────────────────────────────────────────');
console.log(`${passed}/${passed + failed} look checks passed`);
process.exit(failed ? 1 : 0);
