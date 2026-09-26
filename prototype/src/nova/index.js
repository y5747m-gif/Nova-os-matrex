/* ══════════════════════════════════════════════════════════════
   NOVA OS — Unified System Index
   Exports all NOVA engines and systems per spec #58
   nova-core, nova-system-ui, nova-launcher, nova-motion, nova-glass,
   nova-shapes, nova-gesture, nova-window, nova-notification, nova-control,
   nova-search, nova-ai, nova-security, nova-settings, nova-canvas,
   nova-spaces, nova-performance, nova-haptics, nova-audio
   ══════════════════════════════════════════════════════════════ */

// Design Tokens
export { NovaTokens, default as tokens } from './tokens/tokens.js';

// Glass Engine
export { 
  GlassLevels,
  NovaGlassSurface,
  NovaGlassCard,
  NovaGlassPanel,
  NovaGlassButton,
  NovaGlassDialog,
  NovaGlassNavigation,
  NovaGlassNotification,
  NovaGlassOrb,
  createGlass,
  glassManager,
  selectAdaptiveGlassLevel,
  default as glass
} from './glass/glass.js';

// Shape Engine
export {
  NovaShape,
  NovaOrb,
  NovaCapsule,
  NovaPrism,
  NovaRing,
  NovaCrystal,
  NovaNode,
  NovaArc,
  NovaRibbon,
  createShape,
  ShapeUsage,
  shapeSystem,
  default as shapes
} from './shapes/shapes.js';

// Motion API
export {
  MotionAPI,
  TextMotion,
  NovaMotionAPI,
  default as motionAPI
} from './motion/motion-api.js';

// Performance Manager
export {
  DeviceTiers,
  PerformanceModes,
  performanceManager,
  default as performance
} from './performance/performance.js';

// Gesture Engine
export {
  GestureTypes,
  GestureZones,
  gestureEngine,
  default as gesture
} from './gesture/gesture.js';

// Text Motion
export {
  TextMotionTypes,
  NovaTextMotion,
  textMotion,
  default as text
} from './text/text-motion.js';

// Haptics
export {
  HapticPatterns,
  hapticsEngine,
  default as haptics
} from './haptics/haptics.js';

// Audio
export {
  SoundEvents,
  SoundPack,
  audioEngine,
  default as audio
} from './audio/audio.js';

// Find
export {
  SearchCategories,
  findEngine,
  default as find
} from './find/find.js';

// Spaces
export {
  DefaultSpaces,
  spacesManager,
  default as spaces
} from './spaces/spaces.js';

// Security
export {
  PermissionTypes,
  securityCenter,
  default as security
} from './security/security.js';

// AI
export {
  AIStates,
  AICapabilities,
  aiEngine,
  default as ai
} from './ai/ai.js';

// Settings
export {
  SettingsSections,
  MotionPresets,
  GlassPresets,
  settingsManager,
  default as settings
} from './settings/settings.js';

/* ── NOVA OS Identity per spec #4 ──────────────────────────── */
export const NovaOS = {
  name: 'NOVA OS',
  experience: 'NOVA EXPERIENCE',
  visualEngine: 'NOVA VISUAL ENGINE',
  motion: 'NOVA MOTION',
  core: 'NOVA CORE',
  find: 'NOVA FIND',
  spaces: 'NOVA SPACES',
  canvas: 'NOVA CANVAS',
  flow: 'NOVA FLOW',
  control: 'NOVA CONTROL',
  ai: 'NOVA AI',
  security: 'NOVA SECURITY',
  version: '1.0.1',
  build: 'nova-os-v1',
};

/* ── Initialize all systems ────────────────────────────────── */
export function initNovaSystems() {
  console.log(`%c${NovaOS.name} %c${NovaOS.version} — Initializing...`, 
    'color: #7C6CFF; font-weight: 700; font-size: 14px;',
    'color: #A6AEC2; font-size: 12px;'
  );

  // Apply settings
  try {
    const { settingsManager } = require('./settings/settings.js');
    settingsManager.applyAll();
  } catch {}

  // Start performance monitoring
  try {
    performanceManager.startMonitoring();
  } catch {}

  // Log system info
  try {
    const perf = performanceManager.getDebugInfo();
    console.log('NOVA Performance:', perf);
    console.log('NOVA Glass Level:', glassManager.getLevel());
    console.log('NOVA Device Tier:', perf.tier);
  } catch {}

  console.log(`%c${NovaOS.name} Ready — Intent → Interaction → Motion → Action → Completion`,
    'color: #34D399; font-weight: 600;'
  );
}

/* ── System Health Check ───────────────────────────────────── */
export function systemHealthCheck() {
  /* The engines are modules now, not loose globals on `window`, so probing
     `typeof NovaTokens` only ever reported "missing". Ask the shell what it
     actually mounted, and read the tokens off the live document. */
  const S = (typeof window !== 'undefined' && window.NovaSystems) || {};
  const token = (name) => (typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    : '');
  const checks = {
    tokens:      !!S.tokens && !!token('--nv-accent'),
    glass:       !!S.glass?.manager,
    shapes:      !!S.shapes?.system,
    motion:      !!S.motion,
    performance: !!S.performance,
    gesture:     !!S.gesture,
    text:        !!S.textMotion,
    haptics:     !!S.haptics,
    audio:       !!S.audio,
    find:        !!S.find,
    spaces:      !!S.spaces,
    security:    !!S.security,
    ai:          !!S.ai,
    settings:    !!S.settings,
  };

  const allPass = Object.values(checks).every(Boolean);
  console.log('NOVA System Health:', allPass ? '\u2713 All systems nominal' : '\u2717 Issues detected', checks);

  return { healthy: allPass, checks };
}
