/* ════════════════════════════════════════════════════════════════
   NOVA CONTROL — مركز التحكم (iOS Control Center)
   The top-right corner swipe (gesture zone 'corner') pulls down a
   glass sheet of iOS-style modules:
     · connectivity block — طيران · Wi-Fi · بلوتوث · عدم الإزعاج
     · vertical brightness + volume sliders (1:1 finger tracking)
     · quick tiles — صوت · كشاف · حركة أقل · تخصيص
     · a pill into NOVA CORE, backdrop tap to close
   Every toggle still routes through the same ctx callbacks — only
   the geometry changed. Motion stays engine-owned: springs for
   entrances, direct finger tracking for the sliders, no timers.
   ════════════════════════════════════════════════════════════════ */

import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { state } from '../core/store.js';
import { soundOn, getVolume } from '../core/sound.js';
import { nova } from '../motion/config.js';
import NovaMotion from '../motion/motion.js';

function readBrightness() {
  try {
    const el = document.getElementById('screen');
    const v = Number(el?.dataset?.brightness);
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
  } catch { return 1; }
}

export function mountControl(layer, ctx = {}) {
  const NODES = [
    { id: 'wifi',       label: 'Wi-Fi',         icon: 'wifi',      value: 1, binary: true, color: '#7dd3fc', mod: 'conn' },
    { id: 'bt',         label: 'بلوتوث',        icon: 'bluetooth', value: 0, binary: true, color: '#6c5ce7', mod: 'conn' },
    { id: 'airplane',   label: 'طيران',         icon: 'airplane',  value: 0, binary: true, color: '#ff6b9a', mod: 'conn' },
    { id: 'dnd',        label: 'عدم الإزعاج',   icon: 'moon',      value: state.dnd ? 1 : 0, binary: true, color: '#a78bfa', mod: 'conn' },
    { id: 'sound',      label: 'الصوت',         icon: 'sound',     value: soundOn() ? 1 : 0, binary: true, color: '#34d399', mod: 'tile' },
    { id: 'torch',      label: 'الكشاف',        icon: 'torch',     value: 0, binary: true, color: '#f5a524', mod: 'tile' },
    { id: 'reduce',     label: 'حركة أقل',      icon: 'motion',    value: nova.profile === 'reduced' ? 1 : 0, binary: true, instant: true, action: 'reduce', color: '#e2e8f0', mod: 'tile' },
    { id: 'look',       label: 'المظهر',        icon: 'settings',  value: 1, binary: true, instant: true, action: 'customize', color: '#a78bfa', mod: 'tile' },
    { id: 'brightness', label: 'السطوع',        icon: 'bulb',      value: readBrightness(), binary: false, slider: true, color: '#f5a524' },
    { id: 'volume',     label: 'مستوى الصوت',   icon: 'sound',     value: getVolume(), binary: false, slider: true, color: '#34d399' },
  ];

  const nodes = [];   /* { def, node } — same shape the old ring exposed */
  const connBlock = h('div', { class: 'cc__block' });
  const tileBlock = h('div', { class: 'cc__block' });
  const sliderRow = h('div', { class: 'cc__sliders' });

  /* ── one round toggle tile ───────────────────────────────────── */
  function tile(def) {
    const node = h('button', {
      class: 'control__node',
      dataset: { nodrag: '1', node: def.id, on: def.value > 0.5 ? '1' : '0' },
      title: def.label,
    },
      h('span', { style: { color: def.color }, html: icon(def.icon, 'ico ico--sm') }),
      h('small', {}, def.label));
    const entry = { def, node };
    const layout = () => { node.dataset.on = def.value > 0.5 ? '1' : '0'; };
    entry.layout = layout;

    node.addEventListener('click', () => {
      if (def.instant) {
        ctx.emit?.('success');
        if (def.action === 'reduce') {
          def.value = def.value > 0.5 ? 0 : 1;
          layout();
          ctx.onAction?.('reduce', def.value === 1);
          return;
        }
        ctx.onCustomize?.();
        return;
      }
      def.value = def.value > 0.5 ? 0 : 1;
      layout();
      ctx.emit?.(def.value ? 'success' : 'close');
      ctx.onToggle?.(def, def.value === 1);
    });

    nodes.push(entry);
    return node;
  }

  /* ── one vertical slider (brightness / volume) ───────────────── */
  function slider(def) {
    const fill = h('i', { class: 'cc__fill' });
    const node = h('div', {
      class: 'cc__slider control__node',
      dataset: { nodrag: '1', node: def.id, on: '1' },
      title: def.label,
    },
      h('span', { class: 'cc__sico', style: { color: def.color }, html: icon(def.icon, 'ico ico--sm') }),
      fill,
      h('small', {}, def.label));
    const entry = { def, node };
    const paint = () => { fill.style.height = `${Math.round(def.value * 100)}%`; };
    entry.layout = paint;
    paint();

    let tracking = false;
    let lastStep = Math.round(def.value * 10);
    const grab = (e) => {
      const r = node.getBoundingClientRect();
      if (!r.height) return;
      const v = Math.max(0, Math.min(1, (r.bottom - e.clientY) / r.height));
      def.value = v;
      paint();
      const step = Math.round(v * 10);
      if (step !== lastStep) { lastStep = step; ctx.emit?.('tick'); }
      ctx.onValueChange?.(def);
    };
    node.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      tracking = true;
      node.dataset.active = '1';
      try { node.setPointerCapture?.(e.pointerId); } catch { /* engine-less hosts */ }
      e.stopPropagation();
      grab(e);
    });
    node.addEventListener('pointermove', (e) => { if (tracking) grab(e); });
    const release = () => { tracking = false; delete node.dataset.active; };
    node.addEventListener('pointerup', release);
    node.addEventListener('pointercancel', release);

    nodes.push(entry);
    return node;
  }

  for (const def of NODES) {
    if (def.mod === 'conn') connBlock.append(tile(def));
    else if (def.mod === 'tile') tileBlock.append(tile(def));
    else sliderRow.append(slider(def));
  }

  const core = h('button', {
    class: 'cc__core',
    dataset: { nodrag: '1' },
    onclick: () => ctx.onCore?.(),
  }, h('span', {}, 'NOVA CORE'), h('small', {}, 'اسحب للمركز'));

  const sheet = h('div', { class: 'cc' },
    h('div', { class: 'cc__head' },
      h('b', {}, 'مركز التحكم'),
      h('span', {}, 'طاقة · اتصالات · إعدادات سريعة')),
    h('div', { class: 'cc__grid' },
      connBlock,
      tileBlock,
      sliderRow),
    core);

  const el = h('div', { class: 'control' }, sheet);
  el.style.opacity = '0';
  layer.append(el);

  /* a modal overlay: screen-level zone gestures must not fight it */
  el.dataset.nodrag = '1';
  el.addEventListener('click', (e) => { if (e.target === el) ctx.onClose?.(); });

  function enter() {
    NovaMotion.spring({
      from: 0, to: 1, springName: 'SOFT',
      onUpdate: (v) => { el.style.opacity = String(v); },
    });
    const items = Array.from(el.querySelectorAll('.control__node, .cc__core'));
    items.forEach((n) => { n.style.opacity = '0'; });
    NovaMotion.cascade({
      items, stagger: NovaMotion.stagger(30), span: 520, springName: 'SNAP',
      onUpdate: (n, i, p) => {
        n.style.opacity = String(Math.min(1, p * 1.7));
        n.style.transform = `translate3d(0, ${((1 - p) * 18).toFixed(2)}px, 0) scale(${(0.92 + 0.08 * p).toFixed(4)})`;
      },
    });
  }

  function state_() {
    return NODES.map((n) => ({ id: n.id, label: n.label, value: n.value }));
  }

  return { el, enter, state: state_, nodes };
}
