package com.rhettharrison.portfolio.service;

import ai.onnxruntime.*;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.nio.FloatBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Semaphore;

/**
 * Loads the RMBG-1.4 ONNX model once at startup and runs background-removal
 * inference on demand. The model file (~170 MB) is NOT bundled — point
 * STICKER_MODEL_PATH at a downloaded copy of
 * https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model.onnx
 *
 * If the model file is missing the service loads in disabled mode and
 * returns the input unchanged — useful for tests/dev without weights.
 */
@Service
@Slf4j
public class BackgroundRemovalService {

    private static final int MODEL_INPUT_SIZE = 1024;
    private static final int MAX_CONCURRENT = 2;

    @Value("${app.stickers.model-path:./models/rmbg-1.4.onnx}")
    private String modelPath;

    private OrtEnvironment env;
    private OrtSession session;
    private String inputName;
    private final Semaphore semaphore = new Semaphore(MAX_CONCURRENT, true);
    private boolean enabled = true;

    @PostConstruct
    void init() {
        Path p = resolveModelPath();
        if (p == null) {
            log.warn("Sticker BG-removal model not found (looked at {} and {}) — running with bg-removal DISABLED. " +
                "Download from https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model.onnx",
                Paths.get(modelPath).toAbsolutePath(),
                Paths.get("server", modelPath.startsWith("./") ? modelPath.substring(2) : modelPath).toAbsolutePath());
            enabled = false;
            return;
        }
        try {
            env = OrtEnvironment.getEnvironment();
            OrtSession.SessionOptions opts = new OrtSession.SessionOptions();
            opts.setIntraOpNumThreads(Math.max(1, Runtime.getRuntime().availableProcessors() / 2));
            session = env.createSession(p.toString(), opts);
            inputName = session.getInputNames().iterator().next();
            enabled = true;
            log.info("RMBG-1.4 model loaded from {} (input '{}')", p, inputName);
        } catch (OrtException e) {
            log.error("Failed to load ONNX model from {}: {}", p, e.getMessage(), e);
        }
    }

    /** Returns the first existing candidate path, or null. */
    private Path resolveModelPath() {
        Path direct = Paths.get(modelPath).toAbsolutePath();
        if (Files.exists(direct)) return direct;
        // Fallback: when launched from the repo root, the file lives under server/.
        String stripped = modelPath.startsWith("./") ? modelPath.substring(2) : modelPath;
        Path serverRelative = Paths.get("server", stripped).toAbsolutePath();
        if (Files.exists(serverRelative)) return serverRelative;
        return null;
    }

    @PreDestroy
    void close() {
        try { if (session != null) session.close(); } catch (OrtException ignored) {}
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Returns a new ARGB BufferedImage with the predicted alpha mask applied.
     * If the model is not loaded, the input is returned unchanged.
     */
    public BufferedImage removeBackground(BufferedImage src) throws Exception {
        if (!enabled || session == null || env == null) return src;

        semaphore.acquire();
        try {
            int srcW = src.getWidth();
            int srcH = src.getHeight();

            // 1) Resize to MODEL_INPUT_SIZE x MODEL_INPUT_SIZE.
            BufferedImage modelIn = new BufferedImage(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = modelIn.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setColor(Color.BLACK);
            g.fillRect(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
            g.drawImage(src, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, null);
            g.dispose();

            // 2) Build NCHW float32 tensor [1,3,H,W]. RMBG-1.4 expects
            //    (pixel/255 - 0.5)/1.0  — i.e. the [0,1] image shifted to
            //    [-0.5, 0.5]. Skipping this normalization causes the model
            //    to output an essentially uniform mask (no bg removal).
            int hw = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
            FloatBuffer buf = FloatBuffer.allocate(3 * hw);
            int[] rgb = modelIn.getRGB(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, null, 0, MODEL_INPUT_SIZE);
            for (int i = 0; i < hw; i++) buf.put(((rgb[i] >> 16) & 0xFF) / 255.0f - 0.5f);
            for (int i = 0; i < hw; i++) buf.put(((rgb[i] >> 8) & 0xFF) / 255.0f - 0.5f);
            for (int i = 0; i < hw; i++) buf.put((rgb[i] & 0xFF) / 255.0f - 0.5f);
            buf.rewind();

            try (OnnxTensor input = OnnxTensor.createTensor(env, buf,
                    new long[]{1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE});
                 OrtSession.Result result = session.run(Map.of(inputName, input))) {

                // 3) Output [1,1,H,W] in [0,1] → flatten to mask[H*W].
                Object raw = result.get(0).getValue();
                float[] mask = flattenMask(raw);

                // 4) Resize the mask back to src dimensions and apply to alpha.
                BufferedImage maskImg = new BufferedImage(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, BufferedImage.TYPE_BYTE_GRAY);
                byte[] maskBytes = new byte[hw];
                float min = Float.MAX_VALUE, max = -Float.MAX_VALUE;
                for (float v : mask) { if (v < min) min = v; if (v > max) max = v; }
                float range = Math.max(1e-6f, max - min);
                for (int i = 0; i < hw; i++) {
                    float v = (mask[i] - min) / range;
                    maskBytes[i] = (byte) Math.round(Math.clamp(v, 0f, 1f) * 255f);
                }
                maskImg.getRaster().setDataElements(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE, maskBytes);

                BufferedImage out = new BufferedImage(srcW, srcH, BufferedImage.TYPE_INT_ARGB);
                BufferedImage scaledMask = new BufferedImage(srcW, srcH, BufferedImage.TYPE_BYTE_GRAY);
                Graphics2D mg = scaledMask.createGraphics();
                mg.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                mg.drawImage(maskImg, 0, 0, srcW, srcH, null);
                mg.dispose();

                int[] srcArgb = new int[srcW * srcH];
                src.getRGB(0, 0, srcW, srcH, srcArgb, 0, srcW);
                byte[] maskArr = new byte[srcW * srcH];
                scaledMask.getRaster().getDataElements(0, 0, srcW, srcH, maskArr);

                int[] outArgb = new int[srcW * srcH];
                for (int i = 0; i < outArgb.length; i++) {
                    int alpha = maskArr[i] & 0xFF;
                    outArgb[i] = (alpha << 24) | (srcArgb[i] & 0x00FFFFFF);
                }
                out.setRGB(0, 0, srcW, srcH, outArgb, 0, srcW);
                return out;
            }
        } finally {
            semaphore.release();
        }
    }

    @SuppressWarnings("unchecked")
    private static float[] flattenMask(Object raw) {
        // ONNX returns float[1][1][H][W] or float[1][H][W] depending on the export.
        if (raw instanceof float[][][][] a) {
            int h = a[0][0].length, w = a[0][0][0].length;
            float[] out = new float[h * w];
            for (int y = 0; y < h; y++) System.arraycopy(a[0][0][y], 0, out, y * w, w);
            return out;
        }
        if (raw instanceof float[][][] a) {
            int h = a[0].length, w = a[0][0].length;
            float[] out = new float[h * w];
            for (int y = 0; y < h; y++) System.arraycopy(a[0][y], 0, out, y * w, w);
            return out;
        }
        throw new IllegalStateException("Unexpected ONNX output type: " + raw.getClass());
    }
}
