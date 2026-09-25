import { getBrazilTodayUtcMidnight } from "./timezone";

export type FixedExpenseCycleInput = {
  dueDay?: number;
  recurrenceMonths: number;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
};

export type CycleSkipReason = "NOT_STARTED" | "ENDED" | "OUT_OF_CYCLE";

export type CycleEligibility = { due: true } | { due: false; reason: CycleSkipReason };

const monthIndex = (date: Date): number => date.getUTCFullYear() * 12 + date.getUTCMonth();

const daysInMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const atDay = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month, Math.min(day, daysInMonth(year, month))));

const startOfUtcDay = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export const cycleDateForInvoice = (fixed: FixedExpenseCycleInput, closingDate: Date): Date => {
  const closing = startOfUtcDay(closingDate);
  if (!fixed.dueDay) return closing;

  const candidate = atDay(closing.getUTCFullYear(), closing.getUTCMonth(), fixed.dueDay);
  if (candidate <= closing) return candidate;

  return atDay(closing.getUTCFullYear(), closing.getUTCMonth() - 1, fixed.dueDay);
};

export const expenseDateForInvoice = (fixed: FixedExpenseCycleInput, closingDate: Date): Date => {
  const cycleDate = cycleDateForInvoice(fixed, closingDate);
  if (fixed.dueDay) return cycleDate;

  const today = getBrazilTodayUtcMidnight();
  return today < cycleDate ? today : cycleDate;
};

export const cycleEligibility = (
  fixed: FixedExpenseCycleInput,
  closingDate: Date,
): CycleEligibility => {
  const cycleDate = cycleDateForInvoice(fixed, closingDate);
  const anchor = fixed.startDate ?? fixed.createdAt;
  const elapsedMonths = monthIndex(cycleDate) - monthIndex(anchor);

  if (elapsedMonths < 0) return { due: false, reason: "NOT_STARTED" };
  if (fixed.endDate && cycleDate > startOfUtcDay(fixed.endDate)) {
    return { due: false, reason: "ENDED" };
  }

  const every = Math.max(1, Math.trunc(fixed.recurrenceMonths));
  if (elapsedMonths % every !== 0) return { due: false, reason: "OUT_OF_CYCLE" };

  return { due: true };
};

export const CYCLE_SKIP_MESSAGES: Record<CycleSkipReason, string> = {
  NOT_STARTED: "ainda não entrou em vigência",
  ENDED: "vigência encerrada",
  OUT_OF_CYCLE: "não vence neste ciclo",
};
