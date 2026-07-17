import { test } from "node:test";
import assert from "node:assert/strict";
import { invoicePeriod, periodKey, samePeriod } from "../../src/utils/invoice-period";

test("invoicePeriod returns 1-based month/year from UTC-midnight closing date", () => {
  assert.deepEqual(invoicePeriod(new Date("2026-07-15T00:00:00.000Z")), { month: 7, year: 2026 });
  assert.deepEqual(invoicePeriod(new Date("2026-01-01T00:00:00.000Z")), { month: 1, year: 2026 });
  assert.deepEqual(invoicePeriod(new Date("2026-12-31T00:00:00.000Z")), { month: 12, year: 2026 });
});

test("invoicePeriod does not drift across month boundary regardless of local TZ", () => {
  const firstOfMonth = new Date("2026-08-01T00:00:00.000Z");
  assert.deepEqual(invoicePeriod(firstOfMonth), { month: 8, year: 2026 });
});

test("periodKey is stable and zero-padded", () => {
  assert.equal(periodKey({ month: 7, year: 2026 }), "2026-07");
  assert.equal(periodKey({ month: 12, year: 2026 }), "2026-12");
});

test("samePeriod compares month and year", () => {
  assert.equal(samePeriod({ month: 7, year: 2026 }, { month: 7, year: 2026 }), true);
  assert.equal(samePeriod({ month: 7, year: 2026 }, { month: 8, year: 2026 }), false);
  assert.equal(samePeriod({ month: 7, year: 2026 }, { month: 7, year: 2025 }), false);
});
