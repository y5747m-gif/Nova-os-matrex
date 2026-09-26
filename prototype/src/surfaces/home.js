/* ════════════════════════════════════════════════════════════════
   NOVA HOME — the AURA Dynamic Space (docs/01 §2)

   The old home was an icon grid: pages of tiles you hunt through.
   AURA throws the grid away and answers NOVA's own question —
   «ما الذي تريد فعله؟» — with four calm bands, top to bottom:

     · home__sky    the clock, the greeting, the date and the
                    SPACES chips (شخصي · شغل · سفر · الكل)
     · home__ask    the hero: one pill that opens NOVA FIND, the
                    intent bar is the primary object, not an icon
     · home__cards  live cards produced by state — the next event,
                    your workspace, what's playing — never widgets
     · home__shelf  every app on ONE horizontal orbit shelf with
                    snap + centre emphasis, and a glass dock for the
                    four you actually use (＋ الكل → the CORE drawer)

   Behaviour contract (main.js + tools/experience-check.mjs rely on it):
     · .home__icon[data-app] buttons are the morph source rects
     · long-press an icon → context menu (فتح · معلومات · إزالة)
     · the surface API is unchanged: root/enter/refresh/cardEl/
       anyCardRect/closeMenu/setHidden
   Motion stays engine-owned: springs only — the shelf's centre
   emphasis is a scroll-driven CSS variable, never a hand-rolled
   frame loop.
   ════════════════════════════════════════════════════════════════ */

import { h, clear, fmtTime, fmtDate } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { APPS, appMeta, state, allAppIds, subscribe } from '../core/store.js';
import NovaMotion from '../motion/motion.js';
import { stagger as staggerMs } from '../motion/config.js';
import {
  isNativeLauncher, realApps, realAppIcon, realAppLabel, topRealApps,
  openRealAppInfo, uninstallRealApp,
} from '../core/launcher.js';

const PRESS_MS = 500;                /* long-press → context menu */
const DOCK_DEFAULTS = ['phone', 'whatsapp', 'browser', 'music'];

/* ── SPACES — the same apps, grouped by what you're doing ─────── */
const SPACES = [
  { id: 'all',      label: 'الكل',  apps: null },
  { id: 'personal', label: 'شخصي',  apps: ['whatsapp', 'phone', 'contacts', 'camera', 'gallery', 'music', 'video', 'podcasts', 'books', 'weather', 'health', 'fitness', 'social', 'games', 'store', 'wallet', 'smart', 'wear'] },
  { id: 'work',     label: 'شغل',   apps: ['mail', 'notes', 'tasks', 'calendar', 'files', 'browser', 'meetings', 'translate', 'recorder', 'calc', 'clock', 'cloud', 'passwords', 'terminal'] },
  { id: 'travel',   label: 'سفر',   apps: ['maps', 'weather', 'translate', 'camera', 'gallery', 'browser', 'music', 'wallet', 'files', 'clock'] },
];
const MAX_CARDS = 3;

export function mountHome(layer, ctx = {}) {
  /* ── the shell ─────────────────────────────────────────────── */
  const root = h('div', { class: 'home' });

  const timeEl = h('div', { class: 'home__time' }, fmtTime());
  const hello = h('h2', { class: 'home__hello' }, 'أهلاً ياسين');
  const dateEl = h('p', { class: 'home__date' }, fmtDate());
  const spacesEl = h('div', { class: 'home__spaces' });
  const sky = h('div', { class: 'home__sky' }, timeEl, h('div', { class: 'home__sky-t' }, hello, dateEl), spacesEl);

  const ask = h('button', {
    class: 'home__ask', type: 'button', dataset: { nodrag: '1' },
    onclick: () => ctx.onAsk?.(),
  },
    h('span', { class: 'home__ask-ico', html: icon('search', 'ico') }),
    h('span', { class: 'home__ask-t' }, 'عايز تعمل إيه؟'),
    h('span', { class: 'home__ask-hint' }, 'NOVA FIND — اكتب أو قول'),
  );

  const cardsEl = h('div', { class: 'home__cards' });

  const shelfTitle = h('div', { class: 'home__shelf-title' }, h('b', {}, 'كل التطبيقات'), h('span', {}, ''));
  const rail = h('div', { class: 'home__rail', dataset: { nodrag: '1' } });
  const shelf = h('div', { class: 'home__shelf' }, shelfTitle, rail);

  const dockEl = h('div', { class: 'home__dock' });

  root.append(sky, ask, cardsEl, shelf, dockEl);
  layer.append(root);

  /** appId → its best icon element: the shelf first, the dock overwrites. */
  const cardEls = new Map();
  let railEls = [];
  let space = 'all';
  let press = null;
  let menu = null;
  let menuAnchor = null;
  let away = null;
  let swallow = false;

  const universe = () => (isNativeLauncher() ? realApps().map((a) => a.p) : allAppIds());
  const rtl = () => document.documentElement.dir === 'rtl';

  /* ── one app icon (shelf or dock) ───────────────────────────── */
  function makeIcon(id) {
    const meta = appMeta(id);
    const btn = h('button', { class: 'home__icon', type: 'button', dataset: { app: id } });
    btn.append(face(id));
    btn.append(h('span', {
      class: 'home__icon-label',
      text: APPS[id] ? meta.name : realAppLabel(id),
    }));
    bindPress(btn, id);
    cardEls.set(id, btn);
    return btn;
  }

  function face(id) {
    const meta = appMeta(id);
    const el = h('div', { class: 'home__icon-face' });
    el.style.setProperty('--app-c', meta.color || '#7c6cff');
    const uri = APPS[id] ? '' : realAppIcon(id);
    if (uri) el.append(h('img', { class: 'home__icon-img', src: uri, alt: '', draggable: 'false' }));
    else el.innerHTML = icon(meta.icon, 'ico');
    return el;
  }

  /* ── tap · long-press · context menu ───────────────────────── */
  function bindPress(btn, id) {
    let fired = false;
    let t = null;
    const cancel = () => {
      if (t) { clearTimeout(t); t = null; }
      if (press && press.btn === btn) press = null;
    };
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      fired = false;
      cancel();
      press = { btn, cancel };
      t = setTimeout(() => {
        t = null;
        press = null;
        if (state.surface !== 'home' || state.panel) return;
        fired = true;
        openMenu(id, btn);
      }, PRESS_MS);
    });
    btn.addEventListener('pointerup', cancel);
    btn.addEventListener('pointercancel', cancel);
    btn.addEventListener('pointerleave', cancel);
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      cancel();
      if (state.surface === 'home' && !state.panel) openMenu(id, btn);
    });
    /* the click that follows a long-press (or eats a tap that only closed
       the menu) dies here — before any global click listener sees it */
    btn.addEventListener('click', (e) => {
      if (fired || swallow) {
        e.stopPropagation();
        e.preventDefault();
        fired = false;
        swallow = false;
        return;
      }
      ctx.onOpenApp(id, btn);
    }, true);
  }

  function openMenu(id, anchor) {
    closeMenu();
    const meta = appMeta(id);
    const real = !APPS[id];
    const item = (label, ico, act, danger) => h('button', {
      class: danger ? 'home__menu-item home__menu-item--danger' : 'home__menu-item',
      type: 'button',
      onclick: act,
    },
      h('span', { class: 'home__menu-ico', html: icon(ico, 'ico') }),
      label);

    const card = h('div', { class: 'home__menu-card' },
      h('div', { class: 'home__menu-head' },
        face(id),
        h('b', { class: 'home__menu-name' }, APPS[id] ? meta.name : realAppLabel(id))),
      item('فتح', 'play', () => { closeMenu(); ctx.onOpenApp(id, anchor); }),
      item('معلومات التطبيق', 'shield', () => {
        closeMenu();
        if (real) openRealAppInfo(id);
        else ctx.toast?.(`${meta.name} — ${meta.sub || 'تفاصيل التطبيق'}`);
      }),
      item('إزالة', 'close', () => {
        closeMenu();
        if (real) uninstallRealApp(id);
        else ctx.toast?.('الإزالة الفعلية داخل تطبيق NOVA على أندرويد');
      }, true));

    menu = h('div', { class: 'home__menu', dataset: { nodrag: '1' } }, card);
    root.append(menu);
    menuAnchor = anchor;
    placeMenu(anchor);
    NovaMotion.emit?.('tick');
    NovaMotion.spring({
      from: 0, to: 1, springName: 'SNAP',
      onUpdate: (v) => {
        card.style.opacity = String(Math.min(1, v * 1.6));
        card.style.transform = `translate3d(0, ${((1 - v) * 12).toFixed(2)}px, 0) scale(${(0.9 + 0.1 * v).toFixed(4)})`;
      },
    });
    /* the closing gesture must not eat the press that is still held down
       (registered a beat after open, like every NOVA popup) */
    setTimeout(() => {
      if (!menu) return;
      away = (e) => {
        if (!menu || menu.contains(e.target)) return;
        swallow = true;
        closeMenu();
        setTimeout(() => { swallow = false; }, 650);
      };
      document.addEventListener('pointerdown', away, true);
    }, 60);
  }

  function placeMenu(anchor) {
    if (!menu || !anchor) return;
    const pr = root.getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();
    const half = Math.max(105, (menu.offsetWidth || 210) / 2);
    const height = menu.offsetHeight || 190;
    let x = ar.left - pr.left + ar.width / 2;
    x = Math.max(half + 8, Math.min(pr.width - half - 8, x));
    let y = ar.top - pr.top - height - 10;
    if (y < 8) y = ar.top - pr.top + ar.height + 10;   /* flip below */
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  /** closes an open context menu — true only when something was open (NovaBack). */
  function closeMenu() {
    if (away) {
      document.removeEventListener('pointerdown', away, true);
      away = null;
    }
    if (!menu) {
      menuAnchor = null;
      return false;
    }
    menu.remove();
    menu = null;
    menuAnchor = null;
    return true;
  }

  /* ── SPACES chips ──────────────────────────────────────────── */
  function buildSpaces() {
    const native = isNativeLauncher();
    spacesEl.classList.toggle('hidden', native);
    if (native) return;
    spacesEl.replaceChildren(...SPACES.map((s) => h('button', {
      class: 'home__space',
      type: 'button',
      'aria-pressed': String(space === s.id),
      dataset: { space: s.id },
      onclick: () => {
        if (space === s.id) return;
        space = s.id;
        ctx.emit?.('tick');
        refresh();
      },
    }, s.label)));
  }

  function spaceIds() {
    const found = SPACES.find((s) => s.id === space);
    const list = found && found.apps ? found.apps.filter((id) => APPS[id] || !isNativeLauncher()) : null;
    const all = universe();
    return list ? all.filter((id) => list.includes(id)) : all;
  }

  /* ── the orbit shelf: snap + centre emphasis (scroll-driven) ── */
  function paintCentre() {
    const r = rail.getBoundingClientRect();
    if (!r.width) return;
    const mid = rtl() ? r.right - r.width / 2 : r.left + r.width / 2;
    for (const el of railEls) {
      const b = el.getBoundingClientRect();
      const d = Math.abs((b.left + b.width / 2) - mid) / (r.width / 2);
      el.style.setProperty('--c', Math.max(0, 1 - d).toFixed(3));
    }
  }
  rail.addEventListener('scroll', paintCentre, { passive: true });
  window.addEventListener('resize', paintCentre, { passive: true });

  /* a vertical wheel over a horizontal shelf still scrolls the shelf */
  for (const el of [rail, cardsEl]) {
    el.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });
  }

  /* 1:1 finger tracking for a horizontal scroller. The scroller owns its
     pointer the moment the gesture is horizontal, so vertical travel keeps
     reaching the surface gestures (CORE / FLOW). `snap` parks it on the
     nearest icon with a spring; without it the cards just follow the finger. */
  function dragScroll(el, { snap = false } = {}) {
    let drag = null;
    let settle = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (drag) return;
      drag = {
        id: e.pointerId, x0: e.clientX, sx: el.scrollLeft,
        dir: rtl() ? -1 : 1, moved: false, lx: e.clientX, lt: Date.now(), vx: 0,
      };
    });
    el.addEventListener('pointermove', (e) => {
      const d = drag;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x0;
      if (!d.moved) {
        if (Math.abs(dx) < 6) return;
        d.moved = true;
        press?.cancel();               /* a horizontal claim kills the long-press */
        closeMenu();
        if (settle) { settle.stop(); settle = null; }
        try { el.setPointerCapture?.(e.pointerId); } catch { /* engine-less hosts */ }
      }
      e.stopPropagation();
      e.preventDefault();
      const now = Date.now();
      d.vx = (e.clientX - d.lx) / Math.max(1, now - d.lt);
      d.lx = e.clientX;
      d.lt = now;
      el.scrollLeft = d.sx - d.dir * dx;
    });
    const endDrag = (e) => {
      const d = drag;
      if (!d || (e && e.pointerId !== d.id)) return;
      drag = null;
      if (!d.moved) return;
      const from = el.scrollLeft;
      let to = from + d.dir * d.vx * 180;          /* a flick carries it */
      if (snap) {
        const step = iconStep();
        to = Math.round(to / step) * step;
      }
      if (settle) { settle.stop(); settle = null; }
      settle = NovaMotion.spring({
        from, to, springName: 'SNAP',
        onUpdate: (v) => { el.scrollLeft = v; },
        onDone: () => { settle = null; },
      });
    };
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
  }
  dragScroll(rail, { snap: true });
  dragScroll(cardsEl, { snap: false });
  /** centre-to-centre distance between two shelf icons, in scroll px. */
  function iconStep() {
    if (railEls.length < 2) return 1;
    const a = railEls[0].getBoundingClientRect();
    const b = railEls[1].getBoundingClientRect();
    return Math.max(1, Math.abs((b.left + b.width / 2) - (a.left + a.width / 2)));
  }

  /* ── live cards — produced by state, never user-placed widgets ─ */
  function buildCards() {
    const items = [];
    const evt = state.events.find((e) => !e.deferred) || state.events[0];
    if (evt) items.push({
      color: evt.color, ico: evt.icon, title: evt.who, sub: evt.body,
      tag: evt.quiet ? 'صامت' : 'الآن',
      act: () => { closePanelIfOpen(); ctx.onOpenApp('whatsapp', cardEl('whatsapp')); },
    });
    items.push({
      color: '#7c6cff', ico: 'layers', title: 'مساحتك', sub: `${state.lastWorkspace.length} تطبيقات جاهزة للاستئناف`,
      tag: 'CANVAS', act: () => ctx.onResume?.(),
    });
    if (state.mediaPlaying) items.push({
      color: '#7c6cff', ico: 'music', title: 'Aurora Drift', sub: 'يشغل الآن · NOVA Sessions',
      tag: 'وسائط', act: () => ctx.onMedia?.(),
    });
    cardsEl.replaceChildren(...items.slice(0, MAX_CARDS).map((c) => {
      /* a CSS custom property must go through setProperty: assigning it on the
         style object is silently dropped, and every card would lose its colour */
      const faceEl = h('span', { class: 'home__card-face', html: icon(c.ico, 'ico ico--sm') });
      faceEl.style.setProperty('--app-c', c.color);
      return h('button', {
        class: 'home__card', type: 'button', dataset: { nodrag: '1' }, onclick: c.act,
      },
        faceEl,
        h('span', { class: 'home__card-t' },
          h('b', {}, c.title),
          h('span', {}, c.sub)),
        h('small', { class: 'home__card-tag' }, c.tag),
      );
    }));
  }

  function closePanelIfOpen() {
    if (state.panel) {
      state.panel = null;
      ctx.onPanelClose?.();
    }
  }

  /* ── build / rebuild ───────────────────────────────────────── */
  function refresh() {
    closeMenu();
    const ids = spaceIds();

    /* the dock: four most-used — recents first in a browser, real usage
       on the device, the classic defaults filling the row. */
    let dockIds = [];
    if (isNativeLauncher()) {
      dockIds = (topRealApps(4) || []).slice(0, 4);
      for (const a of realApps()) {
        if (dockIds.length >= 4) break;
        if (!dockIds.includes(a.p)) dockIds.push(a.p);
      }
    } else {
      const seen = new Set();
      for (const id of [...(state.lastWorkspace || []), ...DOCK_DEFAULTS]) {
        if (seen.has(id) || dockIds.length >= 4 || !ids.includes(id)) continue;
        seen.add(id);
        dockIds.push(id);
      }
      for (const id of ids) {
        if (dockIds.length >= 4) break;
        if (!seen.has(id)) { seen.add(id); dockIds.push(id); }
      }
    }

    cardEls.clear();
    clear(rail);
    railEls = [];
    for (const id of ids) {
      const el = makeIcon(id);
      rail.append(el);
      railEls.push(el);
    }

    const found = SPACES.find((s) => s.id === space);
    shelfTitle.replaceChildren(
      h('b', {}, found && found.id !== 'all' ? found.label : 'كل التطبيقات'),
      h('span', {}, `${ids.length} تطبيق`),
    );

    clear(dockEl);
    for (const id of dockIds) dockEl.append(makeIcon(id));   /* dock icons win cardEls */
    dockEl.append(h('button', {
      class: 'home__all', type: 'button', dataset: { nodrag: '1' }, title: 'كل التطبيقات',
      onclick: () => ctx.onAllApps?.(),
    }, h('span', { class: 'home__all-ico', html: icon('apps', 'ico ico--sm') }), h('span', {}, 'الكل')));

    buildCards();
    paintCentre();
  }

  function enter() {
    closeMenu();
    refresh();
    const items = [...railEls, ...dockEl.querySelectorAll('.home__icon')];
    if (!items.length) return;
    items.forEach((el) => { el.style.opacity = '0'; });
    NovaMotion.cascade({
      items, stagger: staggerMs(12), span: 640, springName: 'ELASTIC',
      onUpdate: (el, i, ip) => {
        el.style.opacity = String(ip);
        el.style.transform = `translate3d(0, ${((1 - ip) * 14).toFixed(2)}px, 0) scale(${(0.9 + 0.1 * ip).toFixed(4)})`;
      },
    });
  }

  /* the clock answers the minute, quietly */
  setInterval(() => { timeEl.textContent = fmtTime(); }, 15000);

  /* live cards follow the store: a new event, a resumed workspace or media
     starting must repaint them without a full refresh() */
  subscribe((s, what) => {
    if (what === 'events' || what === 'windows' || what === 'focus') {
      try { buildCards(); } catch { /* a detached surface must never throw */ }
    }
  });

  window.addEventListener('nova:launcher', () => { try { refresh(); } catch { /* ignore */ } });
  buildSpaces();
  refresh();

  return {
    root,
    enter,
    refresh,
    cardEl: (appId) => cardEls.get(appId),
    anyCardRect: () => (cardEls.values().next().value || root).getBoundingClientRect(),
    closeMenu,
    setHidden: (v) => { root.dataset.hidden = v ? '1' : '0'; },
  };
}
