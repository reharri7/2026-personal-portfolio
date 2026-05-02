package com.rhettharrison.portfolio.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

/**
 * Port of sticker-server/src/pipeline.ts. Takes an uploaded image and produces:
 *   - a finalized PNG (background-removed, outlined, trimmed)
 *   - the trimmed dimensions
 *   - a 16x16 alpha-mask bitmask (base64)
 *   - a 16x16 PNG blur placeholder (base64 data URL)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class StickerImageProcessor {

    private static final int MAX_SIZE = 2048;
    private static final int NORMALIZE_SIZE = 2048;
    private static final int NORMALIZE_PADDING = 160;
    private static final int OUTLINE_THICKNESS = 50;
    private static final int OUTLINE_THRESHOLD = 5;
    private static final int ALPHA_THRESHOLD = 10;
    private static final int GRID_SIZE = 16;

    private final BackgroundRemovalService bgRemoval;

    public record Result(byte[] pngBytes, int width, int height, String alphaMask, String blurDataUrl) {}

    public Result process(byte[] inputBytes) throws Exception {
        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(inputBytes));
        if (decoded == null) throw new IllegalArgumentException("Unsupported image format");

        // 1) Resize to <= MAX_SIZE on longest side, ensure ARGB.
        BufferedImage resized = resizeToFit(decoded, MAX_SIZE, MAX_SIZE);

        // 2) Background removal (no-op if model missing).
        BufferedImage masked = bgRemoval.removeBackground(resized);

        int w = masked.getWidth();
        int h = masked.getHeight();
        byte[] rgba = toRgba(masked);

        // 3) Trim to opaque bounds.
        int[] bbox = findBoundingBox(rgba, w, h);
        if (bbox == null) return emptyResult();
        int cropW = bbox[2] - bbox[0] + 1;
        int cropH = bbox[3] - bbox[1] + 1;

        // 4) Scale to fit inside (NORMALIZE_SIZE - 2*PADDING) and center.
        int available = NORMALIZE_SIZE - 2 * NORMALIZE_PADDING;
        double scale = Math.min((double) available / cropW, (double) available / cropH);
        int scaledW = (int) Math.round(cropW * scale);
        int scaledH = (int) Math.round(cropH * scale);

        BufferedImage cropped = fromRgba(rgba, w, h)
            .getSubimage(bbox[0], bbox[1], cropW, cropH);
        BufferedImage scaled = new BufferedImage(scaledW, scaledH, BufferedImage.TYPE_INT_ARGB);
        Graphics2D sg = scaled.createGraphics();
        sg.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        sg.drawImage(cropped, 0, 0, scaledW, scaledH, null);
        sg.dispose();

        BufferedImage canvas = new BufferedImage(NORMALIZE_SIZE, NORMALIZE_SIZE, BufferedImage.TYPE_INT_ARGB);
        Graphics2D cg = canvas.createGraphics();
        int offsetX = (NORMALIZE_SIZE - scaledW) / 2;
        int offsetY = (NORMALIZE_SIZE - scaledH) / 2;
        cg.drawImage(scaled, offsetX, offsetY, null);
        cg.dispose();

        byte[] normalized = toRgba(canvas);

        // 5) Outline.
        StickerOutline.Options outlineOpts = new StickerOutline.Options(
            OUTLINE_THICKNESS, 255, 255, 255, 1.0, 1, OUTLINE_THRESHOLD
        );
        byte[] outlined = StickerOutline.addOutline(normalized, NORMALIZE_SIZE, NORMALIZE_SIZE, outlineOpts);

        // 6) Trim again.
        int[] trim = findBoundingBox(outlined, NORMALIZE_SIZE, NORMALIZE_SIZE);
        if (trim == null) return emptyResult();
        int trimW = trim[2] - trim[0] + 1;
        int trimH = trim[3] - trim[1] + 1;
        byte[] trimmed = cropRgba(outlined, NORMALIZE_SIZE, NORMALIZE_SIZE, trim[0], trim[1], trimW, trimH);

        // 7) Encode PNG.
        BufferedImage finalImg = fromRgba(trimmed, trimW, trimH);
        ByteArrayOutputStream pngOut = new ByteArrayOutputStream();
        ImageIO.write(finalImg, "PNG", pngOut);

        // 8) Alpha mask (16x16 bitmask, base64).
        String alphaMask = encodeAlphaMask(trimmed, trimW, trimH);

        // 9) Blur placeholder: 16x16 PNG, base64 data URL.
        BufferedImage blur = new BufferedImage(GRID_SIZE, GRID_SIZE, BufferedImage.TYPE_INT_ARGB);
        Graphics2D bg = blur.createGraphics();
        bg.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        bg.drawImage(finalImg, 0, 0, GRID_SIZE, GRID_SIZE, null);
        bg.dispose();
        ByteArrayOutputStream blurOut = new ByteArrayOutputStream();
        ImageIO.write(blur, "PNG", blurOut);
        String blurDataUrl = "data:image/png;base64," + Base64.getEncoder().encodeToString(blurOut.toByteArray());

        return new Result(pngOut.toByteArray(), trimW, trimH, alphaMask, blurDataUrl);
    }

    private static Result emptyResult() {
        return new Result(new byte[0], 1, 1, "", null);
    }

    private static BufferedImage resizeToFit(BufferedImage src, int maxW, int maxH) {
        int w = src.getWidth();
        int h = src.getHeight();
        if (w <= maxW && h <= maxH && src.getType() == BufferedImage.TYPE_INT_ARGB) return src;
        double scale = Math.min((double) maxW / w, (double) maxH / h);
        scale = Math.min(scale, 1.0);
        int newW = (int) Math.round(w * scale);
        int newH = (int) Math.round(h * scale);
        BufferedImage out = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = out.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(src, 0, 0, newW, newH, null);
        g.dispose();
        return out;
    }

    private static byte[] toRgba(BufferedImage img) {
        int w = img.getWidth();
        int h = img.getHeight();
        int[] argb = img.getRGB(0, 0, w, h, null, 0, w);
        byte[] out = new byte[w * h * 4];
        for (int i = 0; i < argb.length; i++) {
            int p = argb[i];
            out[i * 4]     = (byte) ((p >> 16) & 0xFF);
            out[i * 4 + 1] = (byte) ((p >> 8) & 0xFF);
            out[i * 4 + 2] = (byte) (p & 0xFF);
            out[i * 4 + 3] = (byte) ((p >> 24) & 0xFF);
        }
        return out;
    }

    private static BufferedImage fromRgba(byte[] rgba, int w, int h) {
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        int[] argb = new int[w * h];
        for (int i = 0; i < argb.length; i++) {
            int r = rgba[i * 4] & 0xFF;
            int g = rgba[i * 4 + 1] & 0xFF;
            int b = rgba[i * 4 + 2] & 0xFF;
            int a = rgba[i * 4 + 3] & 0xFF;
            argb[i] = (a << 24) | (r << 16) | (g << 8) | b;
        }
        img.setRGB(0, 0, w, h, argb, 0, w);
        return img;
    }

    private static byte[] cropRgba(byte[] rgba, int w, int h, int left, int top, int cw, int ch) {
        byte[] out = new byte[cw * ch * 4];
        for (int y = 0; y < ch; y++) {
            int srcOff = ((top + y) * w + left) * 4;
            int dstOff = (y * cw) * 4;
            System.arraycopy(rgba, srcOff, out, dstOff, cw * 4);
        }
        return out;
    }

    /** Returns [minX, minY, maxX, maxY] or null when no opaque pixel exists. */
    private static int[] findBoundingBox(byte[] rgba, int w, int h) {
        int minX = w, minY = h, maxX = -1, maxY = -1;
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                int a = rgba[(y * w + x) * 4 + 3] & 0xFF;
                if (a > ALPHA_THRESHOLD) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (maxX < 0 || maxY < 0) return null;
        return new int[]{minX, minY, maxX, maxY};
    }

    private static String encodeAlphaMask(byte[] rgba, int w, int h) {
        byte[] bytes = new byte[(GRID_SIZE * GRID_SIZE + 7) / 8];
        double cellW = (double) w / GRID_SIZE;
        double cellH = (double) h / GRID_SIZE;
        for (int gy = 0; gy < GRID_SIZE; gy++) {
            for (int gx = 0; gx < GRID_SIZE; gx++) {
                int px = Math.min((int) Math.floor((gx + 0.5) * cellW), w - 1);
                int py = Math.min((int) Math.floor((gy + 0.5) * cellH), h - 1);
                int a = rgba[(py * w + px) * 4 + 3] & 0xFF;
                if (a > ALPHA_THRESHOLD) {
                    int bit = gy * GRID_SIZE + gx;
                    bytes[bit >> 3] |= (byte) (1 << (bit & 7));
                }
            }
        }
        return Base64.getEncoder().encodeToString(bytes);
    }
}
