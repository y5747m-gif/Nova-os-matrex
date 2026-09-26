/* ══════════════════════════════════════════════════════════════
   NOVA TOKENS — Design Token System
   Single source of truth for colors, typography, spacing, radii,
   elevation, glass, motion, haptics, sound — per spec #62
   ══════════════════════════════════════════════════════════════ */

/* NOVA AURA — ink instead of black, light edges instead of black slabs,
   pills + squircles, one indigo → mint pair. The CSS that actually paints
   the shell lives in styles/tokens.css; this registry mirrors it. */
export const Colors = {
  dark: {
    bg: '#08090F',
    bg2: '#0D0F17',
    surface: '#12151F',
    elevated: '#181C29',
    line: 'rgba(226,232,255,.085)',
    lineStrong: 'rgba(226,232,255,.17)',
    text: '#F3F5FA',
    text2: '#A6AEC2',
    text3: '#6E7789',
    scrim: 'rgba(4,6,14,.6)',
    edge: 'inset 0 1px 0 rgba(255,255,255,.07)',
    glow: 'accent-tinted',
    glass: {
      clear: 'rgba(18,21,31,.42)',
      soft: 'rgba(18,21,31,.62)',
      solid: 'rgba(18,21,31,.86)',
      ultra: 'rgba(18,21,31,.7)',
    }
  },
  light: {
    bg: '#F6F4EF',
    bg2: '#EFEBE2',
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    line: 'rgba(24,22,32,.09)',
    lineStrong: 'rgba(24,22,32,.18)',
    text: '#16181F',
    text2: '#5C6270',
    text3: '#8A8FA0',
    scrim: 'rgba(40,34,26,.3)',
    edge: 'inset 0 1px 0 rgba(255,255,255,.9)',
    glow: 'accent-tinted (26% alpha)',
    glass: {
      clear: 'rgba(255,255,255,.44)',
      soft: 'rgba(255,255,255,.68)',
      solid: 'rgba(255,255,255,.9)',
      ultra: 'rgba(255,255,255,.74)',
    }
  },
  accent: {
    violet: { main: '#7C6CFF', second: '#5EEAD4' },
    aurora: { main: '#4ADE80', second: '#A78BFA' },
    orbit: { main: '#F5A524', second: '#7C6CFF' },
    liquid: { main: '#5EEAD4', second: '#FF6B9A' },
    crystal: { main: '#7DD3FC', second: '#A78BFA' },
    neon: { main: '#FF3D81', second: '#00E5FF' },
  },
  semantic: {
    bloom: '#FF6B9A',
    mint: '#34D399',
    amber: '#F5A524',
    coral: '#FF5C5C',
    ice: '#7DD3FC',
  }
};

export const Typography = {
  families: {
    arabic: '"IBM Plex Sans Arabic", "Cairo", "Noto Sans Arabic", system-ui, sans-serif',
    latin: '"Inter", "IBM Plex Sans Arabic", system-ui, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  scale: {
    display: { size: 46, weight: 600, tracking: -1.4, line: 1.05 },
    title: { size: 25, weight: 600, tracking: -0.5, line: 1.2 },
    heading: { size: 18, weight: 600, tracking: -0.2, line: 1.35 },
    body: { size: 15.5, weight: 400, tracking: 0, line: 1.6 },
    label: { size: 13.5, weight: 500, tracking: 0.1, line: 1.45 },
    caption: { size: 11.5, weight: 500, tracking: 0.4, line: 1.4 },
  },
  /* the lock clock is a poster, not a label */
  lock: { size: 76, weight: 200, tracking: -2, line: 1 },
  arabic: {
    font: 'IBM Plex Sans Arabic',
    fallbacks: ['Cairo', 'Noto Sans Arabic'],
    features: '"ss01" on, "liga" on',
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  tokens: {
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
  }
};

export const Radius = {
  chip: 999,
  card: 26,
  app: '30%',
  window: 30,
  panel: 38,
  orb: 999,
  tokens: {
    chip: 999,
    card: 26,
    app: '30%',
    window: 30,
    panel: 38,
    full: 9999,
  }
};

export const Elevation = {
  flat: 'none',
  /* every level carries --nv-edge (a 1px top highlight) — the black slab is gone */
  card: '0 10px 30px rgba(4,6,14,.45) + inset 0 1px 0 rgba(255,255,255,.07)',
  window: '0 28px 70px rgba(4,6,14,.58) + inset 0 1px 0 rgba(255,255,255,.07)',
  panel: '0 34px 90px rgba(4,6,14,.64) + inset 0 1px 0 rgba(255,255,255,.07)',
  dialog: '0 40px 110px rgba(4,6,14,.7) + inset 0 1px 0 rgba(255,255,255,.07)',
  halo: '0 0 120px -30px accent glow — the device frame only',
  light: {
    card: '0 2px 10px rgba(30,26,20,.07) + inset 0 1px 0 rgba(255,255,255,.9)',
    window: '0 16px 40px rgba(30,26,20,.12) + inset 0 1px 0 rgba(255,255,255,.9)',
    panel: '0 22px 54px rgba(30,26,20,.15) + inset 0 1px 0 rgba(255,255,255,.9)',
  }
};

export const Glass = {
  levels: {
    clear: { blur: 8, opacity: 0.32, edge: 0.08, glow: 0.04, shadow: 0.15 },
    soft: { blur: 14, opacity: 0.56, edge: 0.12, glow: 0.08, shadow: 0.22 },
    solid: { blur: 4, opacity: 0.82, edge: 0.16, glow: 0.02, shadow: 0.30 },
    ultra: { blur: 22, opacity: 0.64, edge: 0.18, glow: 0.14, shadow: 0.28 },
  },
  rendering: {
    maxLiveLayers: 2,
    maxBlur: 22,
    cacheEnabled: true,
    clipped: true,
    staticSnapshot: true,
    gpuAccelerated: true,
  },
  adaptive: {
    highEnd: 'ultra',
    midRange: 'soft',
    lowEnd: 'solid',
    batterySaver: 'solid',
    thermalThrottled: 'solid',
  }
};

export const Motion = {
  durations: {
    fast: 160,
    normal: 320,
    slow: 480,
    long: 650,
  },
  spring: {
    stiffness: { soft: 220, medium: 340, stiff: 520 },
    damping: { soft: 22, medium: 32, stiff: 42 },
    mass: 1,
  },
  themes: {
    aurora: { spring: 'SOFT', timeScale: 1.1, stagger: 56, overshoot: 0.02, arc: 0.45, blur: 1.1 },
    orbit: { spring: 'ORBIT', timeScale: 1.0, stagger: 48, overshoot: 0.05, arc: 1.0, blur: 1 },
    liquid: { spring: 'LIQUID', timeScale: 1.05, stagger: 44, overshoot: 0.06, arc: 0.5, blur: 1.15 },
    crystal: { spring: 'SNAP', timeScale: 0.85, stagger: 32, overshoot: 0.03, arc: 0.7, blur: 0.9 },
    minimal: { spring: 'SNAP', timeScale: 0.6, stagger: 0, overshoot: 0, arc: 0, blur: 0 },
  },
  profiles: {
    cinematic: { timeScale: 1.0, stagger: 40, blur: 12, parallax: 1, arcs: true },
    balanced: { timeScale: 0.85, stagger: 24, blur: 8, parallax: 0.5, arcs: true },
    fast: { timeScale: 0.55, stagger: 0, blur: 0, parallax: 0, arcs: false },
    minimal: { timeScale: 0.45, stagger: 0, blur: 0, parallax: 0, arcs: false },
    reduced: { timeScale: 0.35, stagger: 0, blur: 0, parallax: 0, arcs: false },
  }
};

export const Haptics = {
  patterns: {
    open: { duration: 8, amplitude: 0.6 },
    close: { duration: 14, amplitude: 0.4 },
    tick: { duration: 3, amplitude: 0.3 },
    snap: { duration: 10, amplitude: 0.7 },
    success: { pattern: [12, 60, 12], amplitude: 0.6 },
    error: { duration: 16, amplitude: 0.8 },
    orb: { pattern: [10, 40, 10], amplitude: 0.5 },
  },
  budget: { maxPerMinute: 40, cooldown: 120 },
};

export const Sound = {
  events: {
    open: { freq: [440, 660], duration: 90, type: 'sine' },
    close: { freq: [330, 220], duration: 130, type: 'sine' },
    success: { freq: [660, 880], duration: 70, gap: 60, type: 'sine' },
    error: { freq: [520, 300], duration: 110, type: 'saw' },
    tick: { freq: 0, duration: 12, type: 'noise' },
  },
  config: { volume: 0.35, enabled: true },
};

export const Performance = {
  modes: {
    ultra: { blur: 22, particles: true, background: true, shadows: true, glass: 'ultra' },
    balanced: { blur: 12, particles: true, background: true, shadows: true, glass: 'soft' },
    performance: { blur: 4, particles: false, background: true, shadows: false, glass: 'solid' },
    battery: { blur: 0, particles: false, background: false, shadows: false, glass: 'solid' },
    reduced: { blur: 0, particles: false, background: false, shadows: false, glass: 'solid' },
  },
  thresholds: {
    fps: 55,
    memory: 0.85,
    thermal: 'moderate',
  }
};

export const Shapes = {
  orb: { radius: 999, interactive: true, states: ['idle', 'listening', 'thinking', 'processing', 'success', 'error'] },
  capsule: { radius: 999, ratio: 2.5, interactive: true },
  prism: { sides: 6, radius: 22, interactive: true },
  ring: { thickness: 3, radius: 28, interactive: true },
  crystal: { facets: 8, radius: 22, interactive: true },
  node: { radius: 6, line: 1.5, interactive: true },
  arc: { thickness: 4, angle: 270, interactive: true },
  ribbon: { width: 4, curve: 0.5, interactive: true },
};

export const NovaTokens = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  elevation: Elevation,
  glass: Glass,
  motion: Motion,
  haptics: Haptics,
  sound: Sound,
  performance: Performance,
  shapes: Shapes,
};

export default NovaTokens;
