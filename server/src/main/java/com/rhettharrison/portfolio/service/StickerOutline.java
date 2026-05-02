package com.rhettharrison.portfolio.service;

/**
 * Port of sticker-server/src/outline.ts. Adds a white outline around opaque
 * pixels in an RGBA buffer using a chamfer-distance signed-distance field.
 */
public final class StickerOutline {

    private static final float CHAMFER_DIAG = 1.414f;
    private static final float CHAMFER_ORTHO = 1.0f;

    private StickerOutline() {}

    public record Options(int thickness, int r, int g, int b,
                           double opacity, int positionValue, double threshold) {}

    public static byte[] addOutline(byte[] rgba, int width, int height, Options opts) {
        int pixelCount = width * height;

        float[] alpha = new float[pixelCount];
        for (int i = 0; i < pixelCount; i++) {
            alpha[i] = (rgba[i * 4 + 3] & 0xFF) / 255.0f;
        }

        float[] outerDist = new float[pixelCount];
        for (int i = 0; i < pixelCount; i++) {
            outerDist[i] = alpha[i] > 0.1f ? 0f : 1e10f;
        }
        chamferDistance(outerDist, width, height);

        float[] innerDist = new float[pixelCount];
        for (int i = 0; i < pixelCount; i++) {
            innerDist[i] = alpha[i] <= 0.1f ? 0f : 1e10f;
        }
        chamferDistance(innerDist, width, height);

        byte[] output = new byte[pixelCount * 4];
        double innerEdge = opts.thickness * (double) opts.positionValue;
        double outerEdge = opts.thickness * (1.0 - opts.positionValue);
        double cr = opts.r;
        double cg = opts.g;
        double cb = opts.b;

        for (int i = 0; i < pixelCount; i++) {
            boolean isInside = alpha[i] > 0.1f;
            double signedDist = (isInside ? -innerDist[i] : outerDist[i]) + opts.threshold;
            double low = -outerEdge;
            double high = innerEdge;

            double outlineAlpha = 0;
            if (signedDist >= low - 0.5 && signedDist <= high + 0.5) {
                double t1 = smoothstep(low - 0.5, low + 0.5, signedDist);
                double t2 = 1 - smoothstep(high - 0.5, high + 0.5, signedDist);
                outlineAlpha = t1 * t2;
            }

            double blendAlpha = outlineAlpha * opts.opacity;
            int origR = rgba[i * 4] & 0xFF;
            int origG = rgba[i * 4 + 1] & 0xFF;
            int origB = rgba[i * 4 + 2] & 0xFF;
            double origA = (rgba[i * 4 + 3] & 0xFF) / 255.0;

            output[i * 4]     = (byte) Math.round(origR * (1 - blendAlpha) + cr * blendAlpha);
            output[i * 4 + 1] = (byte) Math.round(origG * (1 - blendAlpha) + cg * blendAlpha);
            output[i * 4 + 2] = (byte) Math.round(origB * (1 - blendAlpha) + cb * blendAlpha);
            output[i * 4 + 3] = (byte) Math.round(Math.max(origA, blendAlpha) * 255.0);
        }
        return output;
    }

    private static void chamferDistance(float[] dist, int width, int height) {
        for (int y = 1; y < height - 1; y++) {
            for (int x = 1; x < width - 1; x++) {
                int idx = y * width + x;
                float v = dist[idx];
                v = Math.min(v, dist[(y - 1) * width + (x - 1)] + CHAMFER_DIAG);
                v = Math.min(v, dist[(y - 1) * width + x] + CHAMFER_ORTHO);
                v = Math.min(v, dist[(y - 1) * width + (x + 1)] + CHAMFER_DIAG);
                v = Math.min(v, dist[y * width + (x - 1)] + CHAMFER_ORTHO);
                dist[idx] = v;
            }
        }
        for (int y = height - 2; y >= 1; y--) {
            for (int x = width - 2; x >= 1; x--) {
                int idx = y * width + x;
                float v = dist[idx];
                v = Math.min(v, dist[(y + 1) * width + (x + 1)] + CHAMFER_DIAG);
                v = Math.min(v, dist[(y + 1) * width + x] + CHAMFER_ORTHO);
                v = Math.min(v, dist[(y + 1) * width + (x - 1)] + CHAMFER_DIAG);
                v = Math.min(v, dist[y * width + (x + 1)] + CHAMFER_ORTHO);
                dist[idx] = v;
            }
        }
    }

    private static double smoothstep(double edge0, double edge1, double x) {
        double t = Math.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    }
}
