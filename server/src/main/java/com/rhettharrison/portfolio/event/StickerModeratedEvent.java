package com.rhettharrison.portfolio.event;

/**
 * Published when a sticker is approved or rejected, but only when the submitter left an
 * email. Carries plain fields (the entity may be deleted on rejection). Drives the
 * approve/reject notification email.
 */
public record StickerModeratedEvent(String email, String username, boolean approved) {}
