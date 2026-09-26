/* ════════════════════════════════════════════════════════════════
   iOS HOME — الشبكة المُقسّمة صفحات + الشريط السفلي + قائمة السياق
   Phase 1 of the iOS-style conversion (docs/01 §2): the rotating
   ring (كرة التطبيقات) and the suggestion cards are gone. The home
   surface is now —
     · a 4×6 PAGED grid of every installed app: the full demo
       catalogue in a browser, the live Kotlin NovaBridge list on
       the device (0 apps must still render, quietly);
     · a fixed glass Dock carrying the four most-used apps
       (recents/defaults in a browser, real usage on the device);
     · a long-press context menu — فتح · معلومات التطبيق · إزالة —
       wired to the existing bridge: launchApp / openRealAppInfo /
       uninstallRealApp (demo apps fall back to a toast).
   Motion stays engine-owned: springs only — no hand-rolled frames,
   no inline transitions, no easing curves in JS. Paging is
   transform-driven and cooperative: it claims the pointer only
   after a horizontal-dominant swipe, so vertical swipes keep
   reaching the surface gesture system (CORE / FLOW).
   ════════════════════════════════════════════════════════════════ */

import { h, clear } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { APPS, appMeta, state, allAppIds, appIconHTML } from '../core/store.js';
import NovaMotion from '../motion/motion.js';
import { stagger as staggerMs } from '../motion/config.js';
import {
  isNativeLauncher, realApps, realAppIcon, realAppLabel, topRealApps,
  openRealAppInfo, uninstallRealApp,
} from '../core/launcher.js';

const PER_PAGE = 24;                 /* 4 columns × 6 rows */
const PRESS_MS = 500;                /* long-press → context menu */
const TAP_SLOP = 10;                 /* px of travel that kills a held press */
const SWIPE_PX = 12;                 /* px before the pager claims the pointer */
const DOCK_DEFAULTS = ['phone', 'whatsapp', 'browser', 'music'];

export function mountHome(layer, ctx) {
  const root = h('div', { class: 'home' });
  const pagesEl = h('div', { class: 'home__pages' });
  const track = h('div', { class: 'home__track' });
  const dotsEl = h('div', { class: 'home__dots' });
  const dockEl = h('div', { class: 'home__dock' });
  pagesEl.append(track);
  root.append(pagesEl, dotsEl, dockEl);
  layer.append(root);

  /** appId → its best icon element: the grid first, then the always-visible Dock overwrites. */
  const cardEls = new Map();
  let pages = [[]];
  let page = 0;                      /* committed page index */
  let dotEls = [];
  let tx = 0;                        /* live track translate, px — engine-written */
  let press = null;                  /* the long-press currently armed */
  let menu = null;                   /* the open context-menu element */
  let menuAnchor = null;             /* the icon it belongs to */
  let away = null;                   /* registered outside-tap closer */
  let swallow = false;               /* this gesture's click must die */
  let settle = null;                 /* the pager's settle-spring handle */
  let drag = null;                   /* the active pager drag */

  /* the real bridge list on the device — the catalogue in a browser */
  const universe = () => (isNativeLauncher() ? realApps() : allAppIds());
  const rtl = () => document.documentElement.dir === 'rtl';
  const pageW = () => Math.max(1, pagesEl.getBoundingClientRect().width || 1);

  /* ── one icon (grid or Dock) ─────────────────────────────────── */
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
    el.style.setProperty('--app-c', meta.color || '#6c5ce7');
    const uri = APPS[id] ? '' : realAppIcon(id);
    if (uri) el.append(h('img', { class: 'home__icon-img', src: uri, alt: '', draggable: 'false' }));
    else el.innerHTML = appIconHTML(id, 'ico');
    return el;
  }

  /* ── tap · long-press · context menu ─────────────────────────── */
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

  /* ── paging: 1:1 finger tracking + a spring to settle ─────────── */
  function setDot(i) {
    dotEls.forEach((d, n) => d.classList.toggle('home__dot--on', n === i));
  }

  function goTo(target, animate) {
    const max = Math.max(0, pages.length - 1);
    page = Math.max(0, Math.min(max, target));
    setDot(page);
    const sign = rtl() ? 1 : -1;
    const to = sign * page * pageW();
    if (settle) { settle.stop(); settle = null; }
    if (!animate) {
      tx = to;
      track.style.transform = `translate3d(${to}px, 0, 0)`;
      return;
    }
    const from = tx;
    settle = NovaMotion.spring({
      from, to, springName: 'SNAP',
      onUpdate: (v) => {
        tx = v;
        track.style.transform = `translate3d(${v.toFixed(2)}px, 0, 0)`;
      },
      onDone: () => { settle = null; },
    });
  }

  pagesEl.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (drag) return;
    drag = {
      id: e.pointerId,
      x0: e.clientX, y0: e.clientY,
      lx: e.clientX, lt: Date.now(), vx: 0,
      W: pageW(), sign: rtl() ? 1 : -1, p0: 0,
      engaged: false,
    };
  });

  pagesEl.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (!drag.engaged) {
      if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) press?.cancel();
      const claim = pages.length > 1 && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy);
      if (!claim) return;                       /* vertical/diagonal travel stays with the system gestures */
      press?.cancel();
      closeMenu();
      drag.engaged = true;
      if (settle) { settle.stop(); settle = null; }
      drag.W = pageW();
      drag.sign = rtl() ? 1 : -1;
      drag.p0 = tx / (drag.sign * drag.W);
      try { pagesEl.setPointerCapture?.(e.pointerId); } catch { /* engine-less hosts */ }
    }
    e.stopPropagation();                        /* engaged: the pager owns this pointer */
    e.preventDefault();
    const now = Date.now();
    const dt = Math.max(1, now - drag.lt);
    drag.vx = (e.clientX - drag.lx) / dt;
    drag.lx = e.clientX;
    drag.lt = now;
    let pos = drag.p0 + (drag.sign * dx) / drag.W;
    const max = pages.length - 1;
    if (pos < 0) pos *= 0.35;                   /* edge resistance */
    else if (pos > max) pos = max + (pos - max) * 0.35;
    tx = drag.sign * pos * drag.W;
    track.style.transform = `translate3d(${tx.toFixed(2)}px, 0, 0)`;
    setDot(Math.round(pos));
  });

  pagesEl.addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    press?.cancel();
    if (!d.engaged) return;
    const pos = d.p0 + (d.sign * (e.clientX - d.x0)) / d.W;
    const lookahead = ((d.sign * d.vx) / d.W) * 140;   /* a flick carries one more page */
    goTo(Math.round(pos + lookahead), true);
  });

  pagesEl.addEventListener('pointercancel', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const wasEngaged = drag.engaged;
    drag = null;
    if (wasEngaged) goTo(page, false);          /* give the pointer back, snap home */
  });

  /* ── build / rebuild ─────────────────────────────────────────── */
  function refresh() {
    closeMenu();
    const ids = universe();

    /* the Dock: four most-used — recents first in a browser, real usage
       on the device, the classic defaults filling the row. */
    let dockIds = [];
    if (isNativeLauncher()) {
      dockIds = (topRealApps(4) || []).slice(0, 4);
      for (const id of realApps()) {
        if (dockIds.length >= 4) break;
        if (!dockIds.includes(id)) dockIds.push(id);
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

    pages = [];
    for (let i = 0; i < ids.length; i += PER_PAGE) pages.push(ids.slice(i, i + PER_PAGE));
    if (!pages.length) pages = [[]];

    cardEls.clear();
    clear(track);
    for (const group of pages) {
      const el = h('div', { class: 'home__page' });
      for (const id of group) el.append(makeIcon(id));
      track.append(el);
    }

    clear(dotsEl);
    dotEls = pages.map(() => {
      const d = h('span', { class: 'home__dot' });
      dotsEl.append(d);
      return d;
    });
    dotsEl.classList.toggle('hidden', pages.length < 2);

    clear(dockEl);
    for (const id of dockIds) dockEl.append(makeIcon(id));   /* Dock icons win cardEls */
    dockEl.classList.toggle('hidden', dockIds.length === 0);

    if (page > pages.length - 1) page = pages.length - 1;
    if (page < 0) page = 0;
    goTo(page, false);
  }

  function enter() {
    closeMenu();
    refresh();
    const pageEl = track.children[page];
    const items = [
      ...(pageEl ? pageEl.querySelectorAll('.home__icon') : []),
      ...dockEl.querySelectorAll('.home__icon'),
    ];
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

  window.addEventListener('nova:launcher', () => { try { refresh(); } catch { /* ignore */ } });
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
