INSERT INTO "categories" ("id", "user_id", "name", "icon", "is_default", "is_hidden", "sort_order", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    u."id",
    'Despesas Fixas',
    'Repeat',
    true,
    false,
    COALESCE((SELECT MAX(c."sort_order") + 1 FROM "categories" c WHERE c."user_id" = u."id"), 0),
    NOW(),
    NOW()
FROM "users" u
WHERE EXISTS (SELECT 1 FROM "categories" c WHERE c."user_id" = u."id")
ON CONFLICT ("user_id", "name") DO NOTHING;

UPDATE "expenses"
SET "category" = 'Despesas Fixas'
WHERE "fixed_expense_id" IS NOT NULL
  AND "category" = 'Outros';
