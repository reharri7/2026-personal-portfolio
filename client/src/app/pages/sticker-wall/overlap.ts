/**
 * Client-side mirror of the server's StickerOverlapUtil. Used for live
 * placement feedback so a user sees an invalid spot before committing; the
 * server re-runs the same check on submit as the authoritative backstop.
 *
 * The grid resolution is inferred per-mask from its byte length, so masks of
 * different resolutions (legacy 16x16 = 32 bytes, current 32x32 = 128 bytes)
 * interoperate without a data migration. Keep MAX_OVERLAP_RATIO in sync with
 * StickerOverlapUtil.MAX_OVERLAP_RATIO on the server.
 */

/** Max fraction of either sticker that may be covered before it's rejected. */
export const MAX_OVERLAP_RATIO = 0.2;

/** A square bitmask of `gridSize * gridSize` bits → gridSize = sqrt(bits). */
export function gridSizeFromMask(bytes: Uint8Array): number {
  return Math.round(Math.sqrt(bytes.length * 8));
}

export function decodeMask(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function bit(bytes: Uint8Array, idx: number): boolean {
  return ((bytes[idx >> 3] >> (idx & 7)) & 1) !== 0;
}

/** Axis-aligned bounding box [minX, minY, maxX, maxY] of a rotated rect. */
export function rotatedAabb(
  x: number, y: number, w: number, h: number, rotDeg: number
): [number, number, number, number] {
  const r = (rotDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(r));
  const sin = Math.abs(Math.sin(r));
  const expW = w * cos + h * sin;
  const expH = w * sin + h * cos;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return [cx - expW / 2, cy - expH / 2, cx + expW / 2, cy + expH / 2];
}

/**
 * Fraction of A's opaque grid cells whose centre maps to an opaque cell of B,
 * accounting for each sticker's rotation. Falls back to a rotation-aware AABB
 * area ratio when either mask is missing. This metric is directional — call it
 * both ways and take the max to catch a large sticker burying a small one.
 */
export function computeAlphaOverlapRatio(
  ax: number, ay: number, aw: number, ah: number, aRot: number, aMask: Uint8Array | null,
  bx: number, by: number, bw: number, bh: number, bRot: number, bMask: Uint8Array | null
): number {
  const aBox = rotatedAabb(ax, ay, aw, ah, aRot);
  const bBox = rotatedAabb(bx, by, bw, bh, bRot);
  if (aBox[2] < bBox[0] || aBox[0] > bBox[2] || aBox[3] < bBox[1] || aBox[1] > bBox[3]) {
    return 0;
  }

  if (!aMask || !bMask || aMask.length === 0 || bMask.length === 0) {
    const overlapX = Math.min(aBox[2], bBox[2]) - Math.max(aBox[0], bBox[0]);
    const overlapY = Math.min(aBox[3], bBox[3]) - Math.max(aBox[1], bBox[1]);
    return Math.max(0, overlapX * overlapY) / (aw * ah);
  }

  const gsA = gridSizeFromMask(aMask);
  const gsB = gridSizeFromMask(bMask);

  const aCx = ax + aw / 2;
  const aCy = ay + ah / 2;
  const aR = (aRot * Math.PI) / 180;
  const aCos = Math.cos(aR), aSin = Math.sin(aR);

  const bCx = bx + bw / 2;
  const bCy = by + bh / 2;
  const bRi = (-bRot * Math.PI) / 180;
  const bCos = Math.cos(bRi), bSin = Math.sin(bRi);

  let totalOpaque = 0;
  let overlapCount = 0;

  for (let gy = 0; gy < gsA; gy++) {
    for (let gx = 0; gx < gsA; gx++) {
      const aBit = gy * gsA + gx;
      if (!bit(aMask, aBit)) continue;
      totalOpaque++;

      const lx = (gx + 0.5) * (aw / gsA) - aw / 2;
      const ly = (gy + 0.5) * (ah / gsA) - ah / 2;
      const wx = aCx + lx * aCos - ly * aSin;
      const wy = aCy + lx * aSin + ly * aCos;

      const dx = wx - bCx;
      const dy = wy - bCy;
      const bLx = dx * bCos - dy * bSin + bw / 2;
      const bLy = dx * bSin + dy * bCos + bh / 2;
      if (bLx < 0 || bLx >= bw || bLy < 0 || bLy >= bh) continue;

      const bgx = Math.floor((bLx / bw) * gsB);
      const bgy = Math.floor((bLy / bh) * gsB);
      if (bgx < 0 || bgx >= gsB || bgy < 0 || bgy >= gsB) continue;

      if (bit(bMask, bgy * gsB + bgx)) overlapCount++;
    }
  }

  return totalOpaque === 0 ? 0 : overlapCount / totalOpaque;
}

/** Symmetric test: true if either sticker is covered beyond `max`. */
export function overlapsTooMuch(
  ax: number, ay: number, aw: number, ah: number, aRot: number, aMask: Uint8Array | null,
  bx: number, by: number, bw: number, bh: number, bRot: number, bMask: Uint8Array | null,
  max: number = MAX_OVERLAP_RATIO
): boolean {
  const ab = computeAlphaOverlapRatio(ax, ay, aw, ah, aRot, aMask, bx, by, bw, bh, bRot, bMask);
  if (ab > max) return true;
  const ba = computeAlphaOverlapRatio(bx, by, bw, bh, bRot, bMask, ax, ay, aw, ah, aRot, aMask);
  return ba > max;
}
