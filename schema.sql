-- ============================================================
-- Meridian / DR cross-border payments — core schema (Postgres)
-- Mirrors the shapes already used in ui-skeleton.jsx:
--   COUNTERPARTIES     -> counterparties
--   BALANCES           -> account_balances
--   INITIAL_INVOICES   -> invoices
--   INITIAL_LOG        -> compliance_events
--   FX_TO_CAD          -> fx_rates
-- ============================================================

-- Enums keep status values constrained at the database level,
-- instead of trusting the frontend/backend to always send a valid string.
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid');
CREATE TYPE compliance_status AS ENUM ('pending', 'verified');
CREATE TYPE currency_code AS ENUM ('CAD', 'USD', 'CNY', 'JPY');

-- ------------------------------------------------------------
-- businesses
-- One row per business using the platform. Right now that's just
-- The Cedar Tree Company Inc., but this table exists so the system isn't hardcoded
-- to a single company.
-- ------------------------------------------------------------
CREATE TABLE businesses (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    country     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- counterparties
-- Matches the COUNTERPARTIES constant array exactly: name, country,
-- default currency. Scoped to a business since each business has
-- its own set of trading partners.
-- ------------------------------------------------------------
CREATE TABLE counterparties (
    id                SERIAL PRIMARY KEY,
    business_id       INTEGER NOT NULL REFERENCES businesses(id),
    name              TEXT NOT NULL,
    country           TEXT NOT NULL,
    default_currency  currency_code NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- account_balances
-- Matches the BALANCES constant array: one row per currency held
-- by a business. NUMERIC (not FLOAT) is mandatory for money —
-- floats introduce rounding errors that are unacceptable once
-- real currency is involved.
-- ------------------------------------------------------------
CREATE TABLE account_balances (
    id            SERIAL PRIMARY KEY,
    business_id   INTEGER NOT NULL REFERENCES businesses(id),
    currency      currency_code NOT NULL,
    balance       NUMERIC(18,2) NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (business_id, currency)
);

-- ------------------------------------------------------------
-- fx_rates
-- Matches FX_TO_CAD. In the mockup this is a hardcoded JS object;
-- here it's a real table so it can be updated on a schedule from
-- a live rate feed (Wise/Stripe/ECB) instead of being frozen in code.
-- ------------------------------------------------------------
CREATE TABLE fx_rates (
    currency       currency_code PRIMARY KEY,
    rate_to_cad    NUMERIC(12,6) NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- invoices
-- Matches INITIAL_INVOICES exactly, field for field:
--   id (INV-1042)  -> invoice_number (human-readable, still unique)
--   counterparty   -> counterparty_id (foreign key instead of a name string)
--   currency       -> currency
--   amount         -> amount
--   status         -> status
--   compliance     -> compliance_status
--   due            -> due_date
-- Two extra columns (created_at, updated_at) that the mockup didn't
-- need but a real system always should have, for auditability.
-- ------------------------------------------------------------
CREATE TABLE invoices (
    id                  SERIAL PRIMARY KEY,
    invoice_number      TEXT NOT NULL UNIQUE,          -- e.g. 'INV-1042'
    business_id         INTEGER NOT NULL REFERENCES businesses(id),
    counterparty_id     INTEGER NOT NULL REFERENCES counterparties(id),
    currency            currency_code NOT NULL,
    amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    status              invoice_status NOT NULL DEFAULT 'draft',
    compliance_status   compliance_status NOT NULL DEFAULT 'pending',
    due_date            DATE NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- compliance_events
-- Matches INITIAL_LOG / the addLog() calls in advanceStatus() and
-- submitInvoice(). This is the audit trail — the single table a
-- bank reviewer will care about most. Every status change on an
-- invoice should insert a row here, never overwrite one.
-- ------------------------------------------------------------
CREATE TABLE compliance_events (
    id            SERIAL PRIMARY KEY,
    invoice_id    INTEGER NOT NULL REFERENCES invoices(id),
    event_text    TEXT NOT NULL,          -- e.g. 'INV-1042 sent to Northbound Freight Co.'
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes for the queries the dashboard will actually run:
-- "give me all invoices for this business" and
-- "give me the audit trail for this invoice, newest first".
CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_compliance_events_invoice_id ON compliance_events(invoice_id);