#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# NOVA AURA — the app icon, drawn as vectors (no raster source, so
# it stays razor sharp from a 32px favicon to a 1024px store icon).
#
# The mark is the NOVA orbit: a gradient orb crossed by a luminous
# ring. AURA re-cuts it — ink instead of black, one indigo→mint
# pair, a squircle plate with a light edge (docs/05 §1):
#
#   plate   squircle, radius 30 % (--nv-r-app), ink #08090F with a
#           faint indigo bloom at the top and a hairline light edge
#   orb     indigo #7C6CFF → mint #5EEAD4, lit from the top left,
#           58 % of the canvas, wearing the same light edge
#   ring    mint, tilted -18°, the near arc passing IN FRONT of the
#           orb so the mark reads as a planet, not a sticker
#
# It then renders every derived icon from that one master:
#   · PWA / web manifest  icon-192 · icon-512 · maskable · apple · favicon
#   · Android legacy      ic_launcher · ic_launcher_round  (all five densities)
#   · Android adaptive    ic_launcher_background · ic_launcher_foreground
#
# Sizing follows the Android adaptive-icon safe zone (docs/05 §8):
# the "any" icons keep the mark at ~76 % of the canvas, the maskable
# ones at ~58 % so no launcher mask can clip the orb.
#
#   usage: bash tools/make-app-icon.sh
#   needs: ImageMagick (`convert`) — apt install imagemagick
# ══════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")/.."

S=1024                       # master canvas
OUT="prototype/icons"
MASTER="$OUT/nova-icon-source.png"
RES="android/app/src/main/res"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

INK='#08090F'                # --nv-bg
INDIGO='#7C6CFF'             # --nv-accent
MINT='#5EEAD4'               # --nv-accent-2
CX=$(( S / 2 )); CY=$(( S / 2 ))

# ── 1. the squircle plate: ink, indigo bloom at the top, light edge ──
R=$(( S * 30 / 100 ))                    # --nv-r-app
convert -size ${S}x${S} xc:none \
  -fill "$INK" -draw "roundrectangle 0,0 $((S-1)),$((S-1)) $R,$R" \
  "$TMP/plate.png"

# a faint indigo bloom sitting in the top of the plate
convert -size ${S}x${S} radial-gradient:"#1A1F3D-$INK" \
  -gravity north -crop ${S}x$(( S * 62 / 100 ))+0+0 +repage \
  -alpha set -channel A -evaluate multiply 0.62 +channel \
  "$TMP/bloom.png"
convert "$TMP/plate.png" "$TMP/bloom.png" -compose Over -composite "$TMP/plate-bloom.png"

# the AURA light edge: a hairline of white just inside the rim
convert -size ${S}x${S} xc:none \
  -stroke 'rgba(255,255,255,0.10)' -strokewidth 3 -fill none \
  -draw "roundrectangle 3,3 $((S-4)),$((S-4)) $((R-3)),$((R-3))" \
  "$TMP/edge.png"
convert "$TMP/plate-bloom.png" "$TMP/edge.png" -compose Over -composite "$TMP/plate-final.png"

# ── 2. the orb: a sphere lit from the top left, not a flat disc ──
D=$(( S * 58 / 100 ))                     # the safe zone of the mark
G=$(( D * 3 / 2 ))                        # radial gradients need bleed
OFF=$(( D / 4 ))
convert -size ${G}x${G} radial-gradient:"$INDIGO-$MINT" \
  -gravity center -crop ${D}x${D}+${OFF}+${OFF} +repage "$TMP/grad.png"
convert -size ${D}x${D} xc:none -fill white \
  -draw "circle $((D/2)),$((D/2)) $((D/2)),0" "$TMP/mask.png"
convert "$TMP/grad.png" "$TMP/mask.png" -compose CopyOpacity -composite "$TMP/orb.png"

# the sheen: a white ramp, bright in the upper left, fading out by the
# lower right — drawn as greyscale first (rgba() is not a gradient
# colour in ImageMagick), then carried into an alpha channel
convert -size ${G}x${G} radial-gradient:white-black \
  -gravity center -crop ${D}x${D}+${OFF}+${OFF} +repage \
  -channel A -evaluate multiply 0.24 +channel "$TMP/sheen-mask.png"
convert -size ${D}x${D} xc:white "$TMP/sheen-mask.png" \
  -compose CopyOpacity -composite "$TMP/sheen.png"
convert "$TMP/sheen.png" "$TMP/mask.png" -compose DstIn -composite "$TMP/sheen-clip.png"

# the orb wears the same light edge as the plate, only dimmer
convert -size ${D}x${D} xc:none -stroke 'rgba(255,255,255,0.16)' -strokewidth 3 \
  -fill none -draw "circle $((D/2)),$((D/2)) $((D/2-2)),0" "$TMP/orb-edge.png"
convert "$TMP/orb.png" "$TMP/sheen-clip.png" -compose Over -composite \
  "$TMP/orb-edge.png" -compose Over -composite "$TMP/orb-lit.png"

# ── 3. the ring: one ellipse, split so the near arc crosses the orb ──
RX=$(( S * 42 / 100 )); RY=$(( S * 135 / 1000 ))
SW=$(( S * 20 / 1000 ))
ARC_BACK="M $((CX-RX)),$CY A $RX,$RY 0 0 1 $((CX+RX)),$CY"     # over the top
ARC_FRONT="M $((CX+RX)),$CY A $RX,$RY 0 0 1 $((CX-RX)),$CY"    # under the bottom

ring_glow() {                 # <arc> <out> — a crisp arc over its own halo
  convert -size ${S}x${S} xc:none \
    -stroke "$MINT" -strokewidth "$SW" -fill none -draw "path '$1'" "$TMP/arc.png"
  convert "$TMP/arc.png" -channel A -evaluate multiply 0.55 +channel \
    -blur 0x$(( SW * 2 )) "$TMP/halo.png"
  convert "$TMP/halo.png" "$TMP/arc.png" -compose Over -composite "$2"
}
ring_glow "$ARC_BACK"  "$TMP/ring-back.png"
ring_glow "$ARC_FRONT" "$TMP/ring-front.png"

# ── 4. assemble: back arc → orb → front arc, then tilt the whole mark ──
convert -size ${S}x${S} xc:none \
  "$TMP/ring-back.png"  -compose Over -composite \
  "$TMP/orb-lit.png"    -compose Over -composite \
  "$TMP/ring-front.png" -compose Over -composite \
  -background none -rotate -18 -gravity center -extent ${S}x${S} "$TMP/mark.png"

# the orb's own glow against the ink
convert "$TMP/mark.png" -blur 0x$(( S * 3 / 100 )) \
  -channel A -evaluate multiply 0.30 +channel "$TMP/mark-glow.png"

convert -size ${S}x${S} xc:none \
  "$TMP/mark-glow.png"   -compose Over -composite \
  "$TMP/plate-final.png" -compose Over -composite \
  "$TMP/mark.png"        -compose Over -composite \
  "$MASTER"

# ── 5. every derived icon, from that one master ─────────────────
# the mark alone (transparent), and the plate alone — the adaptive layers
convert -size ${S}x${S} xc:none "$TMP/mark.png" -compose Over -composite "$TMP/mark-only.png"
convert -size ${S}x${S} xc:none "$TMP/plate-final.png" -compose Over -composite "$TMP/plate-only.png"

# <size> <ratio> <background> <file> — the mark centred on a background
make_icon() {
  local size="$1" ratio="$2" bg="$3" file="$4"
  local inner
  inner=$(python3 -c "print(int($size*$ratio))")
  convert "$TMP/mark-only.png" -resize "${inner}x${inner}" \
    -background "$bg" -gravity center -extent "${size}x${size}" \
    -strip -define png:compression-level=9 "$file"
}

# ── PWA / web manifest (also the Android fallback icons) ─────────
make_icon 512 0.76 "$INK" "$OUT/icon-512.png"
make_icon 192 0.76 "$INK" "$OUT/icon-192.png"
make_icon 180 0.76 "$INK" "$OUT/apple-touch-icon.png"
make_icon 512 0.58 "$INK" "$OUT/icon-maskable-512.png"   # no launcher mask may clip it
make_icon 32  0.86 "$INK" "$OUT/favicon-32.png"

# ── Android legacy launcher icons: the squircle plate itself ─────
declare -A DPI=( [mdpi]=48 [hdpi]=72 [xhdpi]=96 [xxhdpi]=144 [xxxhdpi]=192 )
for dpi in "${!DPI[@]}"; do
  size="${DPI[$dpi]}"
  dir="$RES/mipmap-$dpi"
  mkdir -p "$dir"
  convert "$MASTER" -resize "${size}x${size}" -strip "$dir/ic_launcher.png"
  # the round variant: the same plate, masked to a circle
  convert "$dir/ic_launcher.png" \
    \( -size ${size}x${size} xc:none -fill white \
       -draw "circle $((size/2)),$((size/2)) $((size/2)),0" \) \
    -compose CopyOpacity -composite -strip "$dir/ic_launcher_round.png"
done

# ── Android adaptive icon: ink background, the mark as foreground ─
for dpi in "${!DPI[@]}"; do
  size=$(( ${DPI[$dpi]} * 108 / 48 ))          # adaptive canvases are 108dp
  dir="$RES/mipmap-$dpi"
  convert -size "${size}x${size}" "xc:$INK" -strip "$dir/ic_launcher_background.png"
  inner=$(python3 -c "print(int($size*0.56))")
  convert "$TMP/mark-only.png" -resize "${inner}x${inner}" -background none \
    -gravity center -extent "${size}x${size}" -strip "$dir/ic_launcher_foreground.png"
done

identify -format "%f  %wx%h  %[colorspace]\n" "$MASTER"
convert "$MASTER" -resize 320x320 /tmp/icon-check.png
convert "$MASTER" -resize 96x96 /tmp/icon-check-small.png
echo "icons written:"
ls -1 "$OUT" | sed 's|^|  icons/|'
for dpi in "${!DPI[@]}"; do
  echo "  res/mipmap-$dpi/ic_launcher*.png"
done
