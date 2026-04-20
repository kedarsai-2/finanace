package com.finance.app.domain.enumeration;

/**
 * QOBOX domain model (generated from frontend src/types/*).
 *
 * Notes:
 * - We model Business-scoped multi-tenancy via required Business relationships.
 * - Money uses BigDecimal.
 * - Dates: Instant (ISO timestamps) and LocalDate where date-only makes sense.
 * - Soft deletes are represented with a boolean `deleted`.
 */
public enum PartyType {
    CUSTOMER,
    SUPPLIER,
    BOTH,
}
