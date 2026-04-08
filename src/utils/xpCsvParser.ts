export interface XpCsvRow {
  date: Date;
  description: string;
  amount: number;
  installment?: {
    current: number;
    total: number;
  };
}

function parseBrazilianCurrency(raw: string): number {
  // "R$ 1.194,08" → 1194.08   |   "R$ -295,28" → -295.28
  const cleaned = raw
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  return parseFloat(cleaned);
}

function parseBrazilianDate(raw: string): Date {
  const [day, month, year] = raw.trim().split("/").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function parseInstallment(
  raw: string,
): { current: number; total: number } | undefined {
  const match = raw.trim().match(/^(\d+)\s+de\s+(\d+)$/i);
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
