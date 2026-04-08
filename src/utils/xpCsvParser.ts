export interface XpCsvRow {
  date: Date;
  description: string;
  amount: number;
  installment?: {
    current: number;
    total: number;
  };
}

export type SupportedCsvBank = "XP" | "NUBANK";

function parseBrazilianCurrency(raw: string): number {
  // "R$ 1.194,08" → 1194.08   |   "R$ -295,28" → -295.28
  const cleaned = raw
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  return Number.parseFloat(cleaned);
}

function parseBrazilianDate(raw: string): Date {
  const [day, month, year] = raw.trim().split("/").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function parseIsoDate(raw: string): Date {
  const [year, month, day] = raw.trim().split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function parseInstallment(
  raw: string,
): { current: number; total: number } | undefined {
  const match = /^(\d+)\s+de\s+(\d+)$/i.exec(raw.trim());
  if (!match) return undefined;
  return { current: Number(match[1]), total: Number(match[2]) };
}

export function parseXpCsv(
  csvContent: string,
  excludeIndexes?: Set<number>,
): XpCsvRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Skip header row
  const dataLines = lines.slice(1);

  const rows: XpCsvRow[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const parts = line.split(";");
    if (parts.length < 5) continue;

    // Skip rows explicitly excluded by the user
    if (excludeIndexes?.has(i)) continue;

    const [rawDate, rawDescription, , rawAmount, rawInstallment] = parts;

    const amount = parseBrazilianCurrency(rawAmount);

    // Skip zero-amount entries
    if (amount === 0) continue;

    rows.push({
      date: parseBrazilianDate(rawDate),
      description: rawDescription.trim(),
      amount,
      installment: parseInstallment(rawInstallment),
    });
  }

  return rows;
}

function parseNubankAmount(raw: string): number {
  const cleaned = raw.replace(/\s+/g, "").replace(",", ".").trim();
  return Number.parseFloat(cleaned);
}

function parseNubankInstallment(
  raw: string,
): { current: number; total: number } | undefined {
  const match = /parcela\s*(\d+)\s*\/\s*(\d+)/i.exec(raw);
  if (!match) return undefined;
  return { current: Number(match[1]), total: Number(match[2]) };
}

export function parseNubankCsv(
  csvContent: string,
  excludeIndexes?: Set<number>,
): XpCsvRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // date,title,amount
  const dataLines = lines.slice(1);

  const rows: XpCsvRow[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    if (excludeIndexes?.has(i)) continue;

    const parts = line.split(",");
    if (parts.length < 3) continue;

    const rawDate = parts[0]?.trim();
    const rawAmount = parts[parts.length - 1]?.trim();
    const rawDescription = parts.slice(1, -1).join(",").trim();

    if (!rawDate || !rawAmount || !rawDescription) continue;

    const amount = parseNubankAmount(rawAmount);
    if (Number.isNaN(amount) || amount === 0) continue;

    rows.push({
      date: parseIsoDate(rawDate),
      description: rawDescription,
      amount,
      installment: parseNubankInstallment(rawDescription),
    });
  }

  return rows;
}

export function parseInvoiceCsv(
  bank: SupportedCsvBank,
  csvContent: string,
  excludeIndexes?: Set<number>,
): XpCsvRow[] {
  if (bank === "NUBANK") {
    return parseNubankCsv(csvContent, excludeIndexes);
  }
  return parseXpCsv(csvContent, excludeIndexes);
}
