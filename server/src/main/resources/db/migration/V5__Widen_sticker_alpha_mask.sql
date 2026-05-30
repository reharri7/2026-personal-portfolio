-- The alpha mask grew from a 16x16 grid (32 bytes -> 44 base64 chars) to a
-- 32x32 grid (128 bytes -> ~172 base64 chars) for finer collision detection,
-- overflowing the original VARCHAR(64). Use TEXT so future resolution changes
-- never overflow again.
ALTER TABLE stickers ALTER COLUMN alpha_mask TYPE TEXT;
