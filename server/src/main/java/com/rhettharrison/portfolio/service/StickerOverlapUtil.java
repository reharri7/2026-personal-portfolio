package com.rhettharrison.portfolio.service;

import java.util.Base64;

/**
 * Mirrors the client's overlap.ts. The alpha-mask grid resolution is inferred
 * per-mask from its byte length, so legacy 16x16 masks (32 bytes) and current
 * 32x32 masks (128 bytes) interoperate without a data migration. Metric:
 * fraction of A's opaque cells whose centre maps to an opaque cell of B.
 */
public final class StickerOverlapUtil {

    public static final double MAX_OVERLAP_RATIO = 0.2;

    private StickerOverlapUtil() {}

    public static byte[] decodeMask(String base64) {
        return Base64.getDecoder().decode(base64);
    }

    public static String encodeMask(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }

    /** A square bitmask of gridSize*gridSize bits → gridSize = sqrt(bits). */
    public static int gridSizeFromMask(byte[] bytes) {
        return (int) Math.round(Math.sqrt(bytes.length * 8.0));
    }

    private static boolean bit(byte[] bytes, int idx) {
        return ((bytes[idx >> 3] >> (idx & 7)) & 1) != 0;
    }

    /**
     * Symmetric test: true if either sticker is covered beyond {@code max}.
     * Catches the asymmetric case where a large sticker buries a small one
     * (the small sticker covers little of the large one, but vice-versa is
     * near-total).
     */
    public static boolean overlapsTooMuch(
        double ax, double ay, double aw, double ah, double aRot, String aMask,
        double bx, double by, double bw, double bh, double bRot, String bMask,
        double max
    ) {
        double ab = computeAlphaOverlapRatio(ax, ay, aw, ah, aRot, aMask, bx, by, bw, bh, bRot, bMask);
        if (ab > max) return true;
        double ba = computeAlphaOverlapRatio(bx, by, bw, bh, bRot, bMask, ax, ay, aw, ah, aRot, aMask);
        return ba > max;
    }

    /**
     * Returns the fraction of A's opaque grid cells whose center maps to an
     * opaque grid cell of B, accounting for each sticker's rotation. Falls
     * back to a rotation-aware AABB area ratio if either alpha mask is
     * missing.
     */
    public static double computeAlphaOverlapRatio(
        double ax, double ay, double aw, double ah, double aRot, String aMask,
        double bx, double by, double bw, double bh, double bRot, String bMask
    ) {
        double[] aBox = rotatedAabb(ax, ay, aw, ah, aRot);
        double[] bBox = rotatedAabb(bx, by, bw, bh, bRot);
        if (aBox[2] < bBox[0] || aBox[0] > bBox[2] || aBox[3] < bBox[1] || aBox[1] > bBox[3]) {
            return 0.0;
        }

        if (aMask == null || bMask == null || aMask.isEmpty() || bMask.isEmpty()) {
            double overlapX = Math.min(aBox[2], bBox[2]) - Math.max(aBox[0], bBox[0]);
            double overlapY = Math.min(aBox[3], bBox[3]) - Math.max(aBox[1], bBox[1]);
            return Math.max(0.0, overlapX * overlapY) / (aw * ah);
        }

        byte[] a = decodeMask(aMask);
        byte[] b = decodeMask(bMask);
        int gsA = gridSizeFromMask(a);
        int gsB = gridSizeFromMask(b);

        // Rotation matrices: aRot rotates A's local grid to world; we use the
        // INVERSE of bRot to map world points back into B's local grid.
        double aCx = ax + aw / 2.0;
        double aCy = ay + ah / 2.0;
        double aR = Math.toRadians(aRot);
        double aCos = Math.cos(aR), aSin = Math.sin(aR);

        double bCx = bx + bw / 2.0;
        double bCy = by + bh / 2.0;
        double bRi = Math.toRadians(-bRot);
        double bCos = Math.cos(bRi), bSin = Math.sin(bRi);

        int totalOpaque = 0;
        int overlapCount = 0;

        for (int gy = 0; gy < gsA; gy++) {
            for (int gx = 0; gx < gsA; gx++) {
                int aBit = gy * gsA + gx;
                if (!bit(a, aBit)) continue;
                totalOpaque++;

                // A's local cell center, relative to A's centre.
                double lx = (gx + 0.5) * (aw / gsA) - aw / 2.0;
                double ly = (gy + 0.5) * (ah / gsA) - ah / 2.0;
                // World-space position after applying A's rotation.
                double wx = aCx + lx * aCos - ly * aSin;
                double wy = aCy + lx * aSin + ly * aCos;

                // Project into B's local frame (translate then inverse-rotate).
                double dx = wx - bCx;
                double dy = wy - bCy;
                double bLx = dx * bCos - dy * bSin + bw / 2.0;
                double bLy = dx * bSin + dy * bCos + bh / 2.0;
                if (bLx < 0 || bLx >= bw || bLy < 0 || bLy >= bh) continue;

                int bgx = (int) Math.floor((bLx / bw) * gsB);
                int bgy = (int) Math.floor((bLy / bh) * gsB);
                if (bgx < 0 || bgx >= gsB || bgy < 0 || bgy >= gsB) continue;

                int bBit = bgy * gsB + bgx;
                if (bit(b, bBit)) overlapCount++;
            }
        }

        return totalOpaque == 0 ? 0.0 : (double) overlapCount / totalOpaque;
    }

    /** Axis-aligned bounding box {minX, minY, maxX, maxY} of a rotated rect. */
    public static double[] rotatedAabb(double x, double y, double w, double h, double rotDeg) {
        double r = Math.toRadians(rotDeg);
        double cos = Math.abs(Math.cos(r));
        double sin = Math.abs(Math.sin(r));
        double expW = w * cos + h * sin;
        double expH = w * sin + h * cos;
        double cx = x + w / 2.0;
        double cy = y + h / 2.0;
        return new double[]{cx - expW / 2.0, cy - expH / 2.0, cx + expW / 2.0, cy + expH / 2.0};
    }
}
