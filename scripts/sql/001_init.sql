CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  salary NUMERIC(12,2),
  avatar TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank TEXT NOT NULL,
  closing_date DATE NOT NULL,
  due_date DATE NOT NULL,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT card_invoices_bank_closing_date_unique UNIQUE (bank, closing_date)
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  receipt TEXT,
  installment_current INTEGER,
  installment_total INTEGER,
  card_invoice_id UUID REFERENCES card_invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  due_day INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fixed_expenses_due_day_check CHECK (due_day BETWEEN 1 AND 31)
);

CREATE INDEX IF NOT EXISTS expenses_card_invoice_id_idx ON expenses(card_invoice_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS fixed_expenses_user_id_is_active_idx ON fixed_expenses(user_id, is_active);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS card_invoices_set_updated_at ON card_invoices;
CREATE TRIGGER card_invoices_set_updated_at
BEFORE UPDATE ON card_invoices
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS expenses_set_updated_at ON expenses;
CREATE TRIGGER expenses_set_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS fixed_expenses_set_updated_at ON fixed_expenses;
CREATE TRIGGER fixed_expenses_set_updated_at
BEFORE UPDATE ON fixed_expenses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
