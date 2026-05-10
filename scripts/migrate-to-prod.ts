import "dotenv/config";
import { Client } from "pg";

type TableName = string;
type RowRecord = Record<string, unknown>;
type QueryField = { name: string };
type QueryResult<T extends RowRecord> = {
  rows: T[];
  fields: QueryField[];
};
type DbClient = {
  query: (text: string, values?: unknown[]) => Promise<QueryResult<RowRecord>>;
};

const EXCLUDED_TABLES = new Set<string>(["_prisma_migrations"]);
const BATCH_SIZE = 500;

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function parseArgs(argv: string[]): { force: boolean } {
  const force = argv.includes("--yes") || process.env.MIGRATION_FORCE === "true";
  return { force };
}

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Variavel ausente: ${name}`);
  }
  return value;
}

async function getTableNames(client: DbClient): Promise<TableName[]> {
  const result = await client.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC
    `,
  );

  const rows = result.rows as Array<{ table_name: string }>;

  return rows
    .map((row: { table_name: string }) => row.table_name)
    .filter((table: string) => !EXCLUDED_TABLES.has(table));
}

async function getForeignKeyDependencies(
  client: DbClient,
  tables: ReadonlyArray<TableName>,
): Promise<Map<TableName, Set<TableName>>> {
  const tableSet = new Set(tables);
  const deps = new Map<TableName, Set<TableName>>();

  for (const table of tables) {
    deps.set(table, new Set<TableName>());
  }

  const result = await client.query(
    `
    SELECT
      child.relname AS child_table,
      parent.relname AS parent_table
    FROM pg_constraint c
    JOIN pg_class child ON child.oid = c.conrelid
    JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
    JOIN pg_class parent ON parent.oid = c.confrelid
    JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
    WHERE c.contype = 'f'
      AND child_ns.nspname = 'public'
      AND parent_ns.nspname = 'public'
    `,
  );

  const rows = result.rows as Array<{
    child_table: string;
    parent_table: string;
  }>;

  for (const row of rows) {
    if (!tableSet.has(row.child_table) || !tableSet.has(row.parent_table)) {
      continue;
    }

    deps.get(row.child_table)?.add(row.parent_table);
  }

  return deps;
}

function topologicalSortTables(
  tables: ReadonlyArray<TableName>,
  deps: ReadonlyMap<TableName, ReadonlySet<TableName>>,
): TableName[] {
  const incoming = new Map<TableName, number>();
  const children = new Map<TableName, Set<TableName>>();

  for (const table of tables) {
    incoming.set(table, deps.get(table)?.size ?? 0);
    children.set(table, new Set<TableName>());
  }

  for (const [child, parents] of deps.entries()) {
    for (const parent of parents) {
      children.get(parent)?.add(child);
    }
  }

  const queue: TableName[] = tables.filter((table) => (incoming.get(table) ?? 0) === 0);
  const ordered: TableName[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    ordered.push(current);

    for (const child of children.get(current) ?? []) {
      const nextIncoming = (incoming.get(child) ?? 0) - 1;
      incoming.set(child, nextIncoming);
      if (nextIncoming === 0) {
        queue.push(child);
      }
    }
  }

  if (ordered.length !== tables.length) {
    console.warn("[migrate-to-prod] Dependencias ciclicas detectadas; usando ordem alfabetica de fallback.");
    return [...tables];
  }

  return ordered;
}

async function truncateTargetTables(client: DbClient, tables: ReadonlyArray<TableName>): Promise<void> {
  if (tables.length === 0) {
    return;
  }

  const qualified = tables.map((table) => `public.${quoteIdentifier(table)}`).join(", ");
  await client.query(`TRUNCATE TABLE ${qualified} RESTART IDENTITY CASCADE;`);
}

async function copyTableData(
  source: DbClient,
  target: DbClient,
  table: TableName,
  batchSize: number,
): Promise<number> {
  const selectSql = `SELECT * FROM public.${quoteIdentifier(table)};`;
  const result = await source.query(selectSql);
  const rows = result.rows as RowRecord[];

  if (rows.length === 0) {
    return 0;
  }

  const columns = result.fields.map((field: QueryField) => field.name);
  const quotedColumns = columns.map(quoteIdentifier).join(", ");
  let inserted = 0;

  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const chunk = rows.slice(offset, offset + batchSize);
    const values: unknown[] = [];

    const placeholders = chunk
      .map((row: RowRecord, rowIndex: number) => {
        const tuple = columns.map((column: string, colIndex: number) => {
          const position = rowIndex * columns.length + colIndex + 1;
          values.push(row[column]);
          return `$${position}`;
        });

        return `(${tuple.join(", ")})`;
      })
      .join(", ");

    const insertSql = `INSERT INTO public.${quoteIdentifier(table)} (${quotedColumns}) VALUES ${placeholders};`;
    await target.query(insertSql, values);
    inserted += chunk.length;
  }

  return inserted;
}

async function run(): Promise<void> {
  const { force } = parseArgs(process.argv.slice(2));

  const sourceDatabaseUrl = requireEnv(
    "MIGRATION_SOURCE_DATABASE_URL (ou DATABASE_URL)",
    process.env.MIGRATION_SOURCE_DATABASE_URL ?? process.env.DATABASE_URL,
  );

  const targetDatabaseUrl = requireEnv(
    "MIGRATION_TARGET_DATABASE_URL (ou PROD_DATABASE_URL)",
    process.env.MIGRATION_TARGET_DATABASE_URL ?? process.env.PROD_DATABASE_URL,
  );

  if (sourceDatabaseUrl === targetDatabaseUrl) {
    throw new Error("Banco de origem e destino sao iguais. Abortando para evitar perda de dados.");
  }

  if (!force) {
    throw new Error(
      "Execucao bloqueada. Rode com --yes (ou MIGRATION_FORCE=true) para confirmar a migracao destrutiva no destino.",
    );
  }

  const sourceClient = new Client({ connectionString: sourceDatabaseUrl });
  const targetClient = new Client({ connectionString: targetDatabaseUrl });

  await sourceClient.connect();
  await targetClient.connect();

  try {
    console.log("[migrate-to-prod] Lendo tabelas do schema public...");
    const tables = await getTableNames(sourceClient);
    const deps = await getForeignKeyDependencies(sourceClient, tables);
    const orderedTables = topologicalSortTables(tables, deps);

    console.log(`[migrate-to-prod] Tabelas detectadas: ${orderedTables.length}`);

    await targetClient.query("BEGIN");
    await truncateTargetTables(targetClient, orderedTables);

    let totalRows = 0;

    for (const table of orderedTables) {
      const copied = await copyTableData(sourceClient, targetClient, table, BATCH_SIZE);
      totalRows += copied;
      console.log(`[migrate-to-prod] ${table}: ${copied} registros`);
    }

    await targetClient.query("COMMIT");
    console.log(`[migrate-to-prod] Concluido com sucesso. Total copiado: ${totalRows} registros.`);
  } catch (error) {
    await targetClient.query("ROLLBACK");
    throw error;
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Erro desconhecido";
  console.error(`[migrate-to-prod] Falha: ${message}`);
  process.exitCode = 1;
});
