export const APP_TIMEZONE = "America/Sao_Paulo";

/**
 * Retorna a data atual no fuso horário do Brasil, normalizada para meia-noite
 * em UTC (mesma convenção dos campos `@db.Date` do Prisma, que armazenam a data
 * como meia-noite UTC). Use para comparar com datas armazenadas sem deslocar dia.
 */
export function getBrazilTodayUtcMidnight(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  const day = Number(parts.find((p) => p.type === "day")!.value);

  return new Date(Date.UTC(year, month - 1, day));
}
