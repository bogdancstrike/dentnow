# DentNow Integration Contracts

This document defines the boundary for future CRM, appointment, email/SMS, analytics,
offer-registration, or patient-portal integrations. **None are implemented in the
first release.** The transactional-outbox and adapter-port scaffolding exists so a
later capability can be added safely.

## Outbound events

- Use cases emit small, **versioned**, non-PII domain events (`.v1` suffix) via
  `src.integrations.outbox.enqueue_event`, inserted in the **same transaction** as the
  business change (`integration_outbox`).
- A future relay implements `OutboundRelayPort` and delivers over HTTP/webhook/Kafka
  or a vendor SDK with **idempotency keys**, retries, and a dead-letter path
  (`integration_deliveries`). qf ETL stays disabled until a real async use case exists.
- Current catalog: see `src.integrations.events.EVENT_TYPES`.

## Inbound integrations

- Terminate at a **versioned adapter endpoint** that verifies signatures, enforces an
  **idempotency key**, and translates the external vendor model into a command owned by
  the target bounded context (anti-corruption).
- External IDs live in `integration_bindings` (`provider`, `binding_type`,
  `external_id` unique) — **never** in core entity primary keys.

## Dependency rule (enforced by test)

`site`, `clinics`, `catalog`, and `editorial` domain code must not import any vendor
SDK or adapter module. They only emit outbox events. See
`tests/architecture/test_dependency_rules.py`.

## Future patient-engagement guardrail (hard gate)

A patient/offer-registration capability is a **separate bounded context** and must NOT
add patient fields to CMS content tables. Before any such endpoint is enabled it
requires ALL of:

- a separate schema with **separate database credentials** and egress allowlists;
- **field-level PII encryption** and a dedicated encryption key (separately approved);
- recorded **consent purpose + version text**, and retention/export/delete workflows;
- **stricter roles** (content editors get no access) and redacted audit policy;
- a new **threat/regulatory assessment**. Clinical/health records trigger a separate
  service/database decision — the CMS is not an EHR or patient-management system.
