package com.rhettharrison.portfolio.service;

import java.util.Base64;

/**
 * Port of src/lib/overlap.ts. 16x16 alpha-mask grid, 32-byte base64 encoding,
 * fraction-of-A's-opaque-cells-that-overlap-B's-opaque-cells overlap metric.
 */
public final class StickerOverlapUtil {

    public static final double MAX_OVERLAP_RATIO = 0.2;
    public static final int GRID_SIZE = 16;

    private StickerOverlapUtil() {}

    public static byte[] decodeMask(String base64) {
        return Base64.getDecoder().decode(base64);
    }

    public static String encodeMask(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }

    private static boolean bit(byte[] bytes, int idx) {
        return ((bytes[idx >> 3] >> (idx & 7)) & 1) != 0;
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
        int gs = GRID_SIZE;

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

        for (int gy = 0; gy < gs; gy++) {
            for (int gx = 0; gx < gs; gx++) {
                int aBit = gy * gs + gx;
                if (!bit(a, aBit)) continue;
                totalOpaque++;

                // A's local cell center, relative to A's centre.
                double lx = (gx + 0.5) * (aw / gs) - aw / 2.0;
                double ly = (gy + 0.5) * (ah / gs) - ah / 2.0;
                // World-space position after applying A's rotation.
                double wx = aCx + lx * aCos - ly * aSin;
                double wy = aCy + lx * aSin + ly * aCos;

                // Project into B's local frame (translate then inverse-rotate).
                double dx = wx - bCx;
                double dy = wy - bCy;
                double bLx = dx * bCos - dy * bSin + bw / 2.0;
                double bLy = dx * bSin + dy * bCos + bh / 2.0;
                if (bLx < 0 || bLx >= bw || bLy < 0 || bLy >= bh) continue;

                int bgx = (int) Math.floor((bLx / bw) * gs);
                int bgy = (int) Math.floor((bLy / bh) * gs);
                if (bgx < 0 || bgx >= gs || bgy < 0 || bgy >= gs) continue;

                int bBit = bgy * gs + bgx;
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
