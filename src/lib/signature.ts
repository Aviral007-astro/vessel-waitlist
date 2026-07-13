// The Seal: a generative, deterministic mark derived entirely from a
// person's real typing rhythm when they wrote something. It is not
// decoration bolted onto a story — it is the actual shape of how that
// piece was written, rendered as something worth looking at on its own.
//
// Two views of the same underlying data:
//   - `buildSeal()` — a compact circular "wax seal" composition: a rhythm
//     ring (overall pace/tempo, like a heartbeat trace) behind a flowing
//     signature stroke that crosses through it, with small marks where the
//     writer paused or corrected themselves. Reads as a distinct silhouette
//     even shrunk to icon size — this is what appears next to a byline and
//     what a reader "collects".
//   - `buildSignatureLine()` — the same stroke unrolled linearly, for the
//     full reveal on a story page.
//
// Both are 100% deterministic: the same keystroke recording always produces
// the exact same seal. Nothing here is randomized — the distinctiveness
// comes entirely from real variation in how people actually type.

export interface StrokePoint {
  x: number;
  y: number;
  width: number;
  isCorrection: boolean;
}

interface RhythmSample {
  deltaMs: number;
  isCorrection: boolean;
}

function toSamples(keystrokes: number[][], maxSamples = 120): RhythmSample[] {
  if (!keystrokes || keystrokes.length === 0) return [];
  const step = Math.max(1, Math.floor(keystrokes.length / maxSamples));
  const samples: RhythmSample[] = [];
  for (let i = 0; i < keystrokes.length; i += step) {
    const stroke = keystrokes[i];
    if (!stroke || stroke.length < 2) continue;
    const [charIndex, deltaMsRaw] = stroke;
    samples.push({
      deltaMs: Math.min(Math.max(deltaMsRaw, 0), 1200),
      isCorrection: charIndex < 0,
    });
  }
  return samples;
}

// --- The flowing stroke (shared by both the seal and the full line) -------

function buildStrokePoints(samples: RhythmSample[]): { x: number; y: number; speedMs: number; isCorrection: boolean }[] {
  const points = [{ x: 0, y: 0, speedMs: 0, isCorrection: false }];
  let x = 0;
  let y = 0;
  let angle = 0.1;
  let angleVelocity = 0;

  for (const s of samples) {
    const nudge = (s.deltaMs / 1200) * (s.isCorrection ? -0.9 : 0.6);
    angleVelocity = angleVelocity * 0.82 + nudge * 0.35;
    angleVelocity = Math.max(-0.35, Math.min(0.35, angleVelocity));
    angle = (angle + angleVelocity) * 0.94;

    const len = 14 + (Math.min(s.deltaMs, 400) / 400) * 22;
    x += Math.cos(angle) * len * 1.6;
    y += Math.sin(angle) * len * 0.55;

    points.push({ x, y, speedMs: s.deltaMs, isCorrection: s.isCorrection });
  }
  return points;
}

function normalize(
  raw: { x: number; y: number; speedMs: number; isCorrection: boolean }[],
  width: number,
  height: number,
  padding: number,
): StrokePoint[] {
  if (raw.length === 0) return [];
  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const targetW = width - padding * 2;
  const targetH = height - padding * 2;
  const scale = Math.min(targetW / spanX, targetH / spanY, 3.2);
  const offsetX = padding + (targetW - spanX * scale) / 2;
  const offsetY = padding + (targetH - spanY * scale) / 2;

  return raw.map((p) => {
    const t = Math.min(p.speedMs, 500) / 500;
    return {
      x: offsetX + (p.x - minX) * scale,
      y: offsetY + (p.y - minY) * scale,
      width: 1.1 + t * 2.2,
      isCorrection: p.isCorrection,
    };
  });
}

function catmullRomPath(points: StrokePoint[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function buildSignatureLine(keystrokes: number[][], width: number, height: number): StrokePoint[] {
  const samples = toSamples(keystrokes);
  return normalize(buildStrokePoints(samples), width, height, 24);
}

export function signatureLineToPath(points: StrokePoint[]): string {
  return catmullRomPath(points);
}

// --- The seal: a circular rhythm-ring + the stroke, radially wrapped -------

export interface SealData {
  ringPath: string; // the rhythm ring as an SVG path (closed loop)
  strokePath: string; // the signature stroke, wrapped to fit inside the ring
  markers: { x: number; y: number }[]; // small dots for corrections — "flaws in the wax"
  size: number;
}

/**
 * Builds the rhythm ring: a closed circular path where the radius at each
 * angle is modulated by typing speed at that point in the piece — a slow,
 * deliberate passage pushes the ring outward; a fast burst pulls it in.
 * This is deterministic and reads like a heartbeat trace bent into a circle.
 */
function buildRing(samples: RhythmSample[], cx: number, cy: number, baseRadius: number): string {
  if (samples.length === 0) {
    return `M ${cx - baseRadius},${cy} A ${baseRadius},${baseRadius} 0 1 0 ${cx + baseRadius},${cy} A ${baseRadius},${baseRadius} 0 1 0 ${cx - baseRadius},${cy}`;
  }

  const n = samples.length;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const t = Math.min(samples[i].deltaMs, 500) / 500; // 0 = fast, 1 = slow
    const wobble = baseRadius * (0.14 + t * 0.22); // slower typing = bigger wobble outward
    const r = baseRadius + wobble - baseRadius * 0.14;
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }

  // Closed Catmull-Rom loop through the ring points
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  d += " Z";
  return d;
}

/**
 * Builds the full seal: rhythm ring + the signature stroke scaled down to
 * sit inside it, plus correction markers placed along the ring at the
 * angles where a backspace occurred. Deterministic — same keystrokes,
 * same seal, every time.
 */
export function buildSeal(keystrokes: number[][], size = 160): SealData {
  const samples = toSamples(keystrokes, 72);
  const cx = size / 2;
  const cy = size / 2;
  const baseRadius = size * 0.36;

  const ringPath = buildRing(samples, cx, cy, baseRadius);

  const innerBox = size * 0.44;
  const strokePoints = normalize(
    buildStrokePoints(samples),
    innerBox,
    innerBox,
    innerBox * 0.12,
  ).map((p) => ({ ...p, x: p.x + (size - innerBox) / 2, y: p.y + (size - innerBox) / 2 }));
  const strokePath = catmullRomPath(strokePoints);

  const markers: { x: number; y: number }[] = [];
  const n = samples.length || 1;
  samples.forEach((s, i) => {
    if (!s.isCorrection) return;
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    markers.push({
      x: cx + Math.cos(angle) * baseRadius,
      y: cy + Math.sin(angle) * baseRadius,
    });
  });

  return { ringPath, strokePath, markers, size };
}
