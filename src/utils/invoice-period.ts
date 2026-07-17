export type Period = { month: number; year: number };

export function invoicePeriod(closingDate: Date): Period {
  const date = closingDate instanceof Date ? closingDate : new Date(closingDate);
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}

export function periodKey(period: Period): string {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

export function samePeriod(a: Period, b: Period): boolean {
  return a.month === b.month && a.year === b.year;
}
