-- Realinha budgets.month/year ao período (mês/ano de fechamento) das faturas ligadas.
-- Corrige budgets legados cujo período escalar divergiu das faturas que rastreiam.
-- Pula linhas cujo realinhamento colidiria com a unique key (user_id, category, month, year)
-- para não perder dados; essas ficam para ajuste manual.

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      b.id AS budget_id,
      b.user_id,
      b.category,
      b.month AS current_month,
      b.year AS current_year,
      target.month AS target_month,
      target.year AS target_year
    FROM budgets b
    JOIN LATERAL (
      SELECT
        EXTRACT(MONTH FROM ci.closing_date)::int AS month,
        EXTRACT(YEAR FROM ci.closing_date)::int AS year
      FROM budget_card_invoices bci
      JOIN card_invoices ci ON ci.id = bci.card_invoice_id
      WHERE bci.budget_id = b.id
      ORDER BY ci.closing_date DESC
      LIMIT 1
    ) target ON TRUE
    WHERE b.month <> target.month OR b.year <> target.year
  LOOP
    IF EXISTS (
      SELECT 1 FROM budgets other
      WHERE other.user_id = rec.user_id
        AND other.category = rec.category
        AND other.month = rec.target_month
        AND other.year = rec.target_year
        AND other.id <> rec.budget_id
    ) THEN
      RAISE NOTICE 'Skipping budget % (%/%): target %/% já ocupado',
        rec.budget_id, rec.current_month, rec.current_year, rec.target_month, rec.target_year;
    ELSE
      UPDATE budgets
      SET month = rec.target_month, year = rec.target_year, updated_at = now()
      WHERE id = rec.budget_id;
    END IF;
  END LOOP;
END $$;
