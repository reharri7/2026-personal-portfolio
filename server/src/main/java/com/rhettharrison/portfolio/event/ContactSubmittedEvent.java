package com.rhettharrison.portfolio.event;

import com.rhettharrison.portfolio.model.Contact;

/** Published after a contact form submission is committed. Drives the admin notice + sender ack. */
public record ContactSubmittedEvent(Contact contact) {}
