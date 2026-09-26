# 05 — Design Tokens

> **ملخص عربي:** كل الألوان والمسافات والحواف والظلال والأصوات والهزّات كـ توكنات، عشان
> النظام كله يبقى متسق. الوضع الداكن اسمه NOVA Dark، والفاتح NOVA Paper. من الإصدار 1.1 الهوية اسمها **NOVA AURA**: خلفية حبر بدل الأسود،
> حافة ضوء فوق كل سطح زجاجي، حبّات دائرية وأيقونات سكويركل، وزوج ألوان واحد (بنفسجي أزرق إلى نعناع).

## 1. Color — NOVA Dark (default) · **AURA**

Since 1.1 the identity is **NOVA AURA**: ink instead of black, light edges instead of black
shadows, pills + squircles, and one accent pair. The old near-black + neon pair is gone.

| Token | Value | Use |
| --- | --- | --- |
| `--nv-bg` | `#08090F` | Ink base — the canvas void (blue-indigo, never `#000`) |
| `--nv-bg-2` | `#0D0F17` | Second ink step (canvas, wallpaper base) |
| `--nv-surface` | `#12151F` | Cards, panels |
| `--nv-elevated` | `#181C29` | Raised windows, dialogs |
| `--nv-line` | `rgba(226,232,255,.085)` | Hairlines, dividers |
| `--nv-line-strong` | `rgba(226,232,255,.17)` | Stronger hairlines |
| `--nv-text` | `#F3F5FA` | Primary text |
| `--nv-text-2` | `#A6AEC2` | Secondary text, metadata |
| `--nv-text-3` | `#6E7789` | Disabled, hints |
| `--nv-edge` | `inset 0 1px 0 rgba(255,255,255,.07)` | The AURA light edge — every glass surface |
| `--nv-glow` | accent-tinted | The only coloured glow (device halo, hero pills) |
| `--nv-accent` | `#7C6CFF` | Primary accent (Nova Indigo) |
| `--nv-accent-2` | `#5EEAD4` | Secondary accent (Nova Mint) |

The four AURA moves, and why:

1. **Ink, not black** — `#08090F` keeps a hint of indigo, so depth reads as *light falling on a
   surface* instead of a hole in the screen.
2. **Light edges** — surfaces are separated by a 1px top highlight (`--nv-edge`) plus an
   accent-tinted glow (`--nv-glow`). Black slabs are gone.
3. **Pills + squircles** — chips and bars are full pills (`--nv-r-chip: 999px`), cards 26px,
   panels 38px, app icons 30% squircles with an inner radial gradient.
4. **One aurora pair** — indigo → mint everywhere; amber stays for attention only.

The NOVA signature is the **orbit mark**: a violet-to-cyan planet crossed by a luminous ring on
near-black. Keep the mark intact and give it clear space; do not place it on a competing gradient
or crop the ring. `prototype/icons/nova-icon-source.png` is the master, and
`bash tools/make-icons.sh` regenerates the PWA and Android density variants. The same mark appears
in the boot splash, setup welcome, app-launch ritual, settings/music identity, and desktop dock. The
Android notification glyph is the monochrome vector at `android/app/src/main/res/drawable/ic_nova_stat.xml`.

## 2. Color — NOVA Paper (light) · **AURA**

Warm paper instead of cool grey — the accent glow reads as ink on paper.

| Token | Value | Use |
| --- | --- | --- |
| `--nv-bg` | `#F6F4EF` | Paper base — warm, never white |
| `--nv-bg-2` | `#EFEBE2` | Second paper step (canvas, wallpaper base) |
| `--nv-surface` | `#FFFFFF` | Cards, panels, app chrome |
| `--nv-elevated` | `#FFFFFF` | Raised windows, dialogs |
| `--nv-edge` | `inset 0 1px 0 rgba(255,255,255,.9)` | The AURA light edge — inverted |
| `--nv-glow` | accent-tinted (26% alpha) | The only coloured glow |

Light mode is not "same shadows, darker text": in Paper, **shadows get tighter and motion gets
*slightly* quicker** (×0.95) because contrast-based depth cues replace shadow-based ones.

Paper also refuses to wash the icon faces out. Every squircle and card face that carries a white
glyph is mixed toward ink instead of white, so a brand colour keeps its contrast on paper — the
shelf icon, the live card, the CORE tile and the CORE result row all use the same deep recipe:

```css
/* a squircle or card face in NOVA Paper */
background: linear-gradient(150deg,
  color-mix(in srgb, var(--app-c) 74%, #1b1d27),
  color-mix(in srgb, var(--app-c) 46%, #0b0d14));
```

## 3. Semantic accents

| Name | Value | Meaning in NOVA |
| --- | --- | --- |
| Bloom | `#FF6B9A` | People / communication events |
| Mint | `#34D399` | Success, confirmations |
| Amber | `#F5A524` | Attention, deferral, thermal chip |
| Coral | `#FF5C5C` | Error, destructive, revoke |
| Ice | `#7DD3FC` | Devices, transfers, files |

## 4. Typography

- Arabic: **IBM Plex Sans Arabic** (fallback: system Arabic). Latin: **Inter**.
- Numerals: Latin for time/percent (per `19:42`), Arabic-Indic only inside Arabic prose if the
  user opts in (Settings → NOVA → Numerals).
- Scale (dp / weight / tracking):

| Token | Size | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
AURA scale — bigger, tighter, more contrast:

| `display` | 46 | 600 | -1.4 | Home clock |
| `title` | 25 | 600 | -0.5 | Greeting, screen titles |
| `heading` | 18 | 600 | -0.2 | Card titles, app chrome |
| `body` | 15.5 | 400 | 0 | Content, the ask bar |
| `label` | 13.5 | 500 | 0.1 | Buttons, chips, cards |
| `caption` | 11.5 | 500 | 0.4 | Metadata, status, icon labels |

The lock clock keeps its own size (76px, weight 200) — it is a poster, not a label.

## 5. Spacing, radii, strokes

```
space: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48
radius: chip 999 (pill) · card 26 · app 30% (squircle) · window 30 · panel 38 · orb 999
stroke: hairline 1 (line color) · light edge 1 (top highlight) · focus 2 (accent) · motion trace 1.5
blur:   gated, ≤ 12 px, ≤ 2 live layers   (see 02-motion-language.md §10)
```

## 6. Elevation & shadow

AURA replaces the black slab with **light edge + accent glow** (see §1):

| Level | Shadow | Notes |
| --- | --- | --- |
| `flat` | none | Background content |
| `card` | `0 10px 30px rgba(4,6,14,.45)` + `--nv-edge` + hairline | Paper: `0 2px 10px rgba(30,26,20,.07)` |
| `window` | `0 28px 70px rgba(4,6,14,.58)` + `--nv-edge` | Floating world |
| `panel` | `0 34px 90px rgba(4,6,14,.64)` + `--nv-edge` | CORE / FLOW / CONTROL |
| `dialog` | `0 40px 110px rgba(4,6,14,.7)` + `--nv-edge` | + scrim below |
| `halo` | `0 0 120px -30px var(--nv-glow)` | The device frame only — one coloured glow per screen |

## 7. Accent packs (mixable with motion themes)

| Pack | Accent | Accent 2 |
| --- | --- | --- |
| Nova Indigo *(default, the AURA pair)* | `#7C6CFF` | `#5EEAD4` |
| Aurora | `#4ADE80` | `#A78BFA` |
| Orbit | `#F5A524` | `#7C6CFF` |
| Liquid | `#22D3EE` | `#FF6B9A` |
| Crystal | `#7DD3FC` | `#A78BFA` |
| Neon | `#FF3D81` | `#00E5FF` |

## 8. Icon language

- 24 dp grid, 1.8 dp stroke, round caps, one continuous line where possible.
- Container is a geometric shape with deliberate inner negative space (not a filled square).
- Optical corrections at 16/20 dp; no two icons share a silhouette.
- Animated icon transitions use NOVA MOTION `FAST` + `SNAP` spring only.

## 9. Sound set (`NovaSound`)

| Event | Name | Character | Synth shape |
| --- | --- | --- | --- |
| Open app / card → space | `open` | soft pulse | sine 440→660 Hz, 90 ms, light low-pass, gentle attack |
| Close app | `close` | low fade | sine 330→220 Hz, 130 ms, long release |
| Success / drop accepted | `success` | double tone | two sines 660 + 880 Hz, 70 ms each, 60 ms gap |
| Error / refused | `error` | short descending | saw-ish 520→300 Hz, 110 ms, soft clip |
| Snap point (split/divider/slider) | `tick` | micro click | filtered noise 12 ms |
| Event arrives (orb) | *silent* | — | orb uses motion only; sound reserved for calls |
| Call | `call` | warm two-note loop | 520/780 Hz, 1.2 s cycle, max 3 cycles then haptics only |

## 10. Haptic set (`NovaHaptics`)

| Event | Waveform | Duration |
| --- | --- | --- |
| Open | light click, sharp attack | 8 ms |
| Close | soft thud, low frequency | 14 ms |
| Drag micro-tick | 1 tick per 8 dp | 3 ms |
| Snap arrival | stronger tick | 10 ms |
| Success | two pulses, 60 ms apart | 2 × 12 ms |
| Error | single rough pulse | 16 ms |
| Orb pull complete | rising double | 2 × 10 ms |

Rules: never vibrate during typing, during a call's audio, or when `Reduced Motion` + "quiet
haptics" is on; total haptic energy per minute is capped by `NovaHaptics.budget(60s)`.

## 11. Motion theme ↔ token pairing (recommended defaults)

| Motion theme | Accent pack | Profile default |
| --- | --- | --- |
| Aurora | Aurora | Balanced |
| Orbit | Orbit | Cinematic |
| Liquid | Liquid | Cinematic |
| Minimal | Nova Violet | Fast (with Reduced-Motion-friendly curves) |
| Neon | Neon | Balanced |
