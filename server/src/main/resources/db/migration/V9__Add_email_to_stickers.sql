-- Optional submitter email so we can notify them when a sticker is moderated.
-- Existing rows stay NULL and simply won't be emailed.
ALTER TABLE stickers ADD COLUMN email VARCHAR(254);
