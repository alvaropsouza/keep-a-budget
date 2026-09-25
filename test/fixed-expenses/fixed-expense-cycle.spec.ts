import { mock, test } from "node:test";
import { brazilTodayIso } from "../../src/utils/timezone";
import assert from "node:assert/strict";
import {
  cycleDateForInvoice,
  cycleEligibility,
  expenseDateForInvoice,
  type FixedExpenseCycleInput,
} from "../../src/utils/fixed-expense-cycle";

const base: FixedExpenseCycleInput = {
  dueDay: 10,
  recurrenceMonths: 1,
  createdAt: new Date("2026-01-05T12:00:00.000Z"),
};

const closing = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

test("cycleDateForInvoice keeps dueDay inside the closing month when it already passed", () => {
  assert.deepEqual(cycleDateForInvoice(base, closing("2026-09-28")), closing("2026-09-10"));
});

test("cycleDateForInvoice steps back a month when dueDay falls after the closing date", () => {
  const lateDueDay: FixedExpenseCycleInput = { ...base, dueDay: 20 };
  assert.deepEqual(cycleDateForInvoice(lateDueDay, closing("2026-10-05")), closing("2026-09-20"));
});

test("cycleDateForInvoice clamps dueDay 31 to the last day of a short month", () => {
  const endOfMonth: FixedExpenseCycleInput = { ...base, dueDay: 31 };
  assert.deepEqual(cycleDateForInvoice(endOfMonth, closing("2026-03-05")), closing("2026-02-28"));
});

test("cycleDateForInvoice falls back to the closing date without dueDay", () => {
  const noDueDay: FixedExpenseCycleInput = { ...base, dueDay: undefined };
  assert.deepEqual(cycleDateForInvoice(noDueDay, closing("2026-09-28")), closing("2026-09-28"));
});

test("monthly recurrence is due on every cycle", () => {
  assert.deepEqual(cycleEligibility(base, closing("2026-09-28")), { due: true });
  assert.deepEqual(cycleEligibility(base, closing("2026-10-28")), { due: true });
});

test("quarterly recurrence is due only every third month from the anchor", () => {
  const quarterly: FixedExpenseCycleInput = {
    ...base,
    recurrenceMonths: 3,
    startDate: closing("2026-01-01"),
  };
  assert.deepEqual(cycleEligibility(quarterly, closing("2026-01-28")), { due: true });
  assert.deepEqual(cycleEligibility(quarterly, closing("2026-02-28")), {
    due: false,
    reason: "OUT_OF_CYCLE",
  });
  assert.deepEqual(cycleEligibility(quarterly, closing("2026-04-28")), { due: true });
  assert.deepEqual(cycleEligibility(quarterly, closing("2027-01-28")), { due: true });
});

test("yearly recurrence anchors on the start month", () => {
  const yearly: FixedExpenseCycleInput = {
    ...base,
    recurrenceMonths: 12,
    startDate: closing("2026-03-01"),
  };
  assert.deepEqual(cycleEligibility(yearly, closing("2026-03-28")), { due: true });
  assert.deepEqual(cycleEligibility(yearly, closing("2026-09-28")), {
    due: false,
    reason: "OUT_OF_CYCLE",
  });
  assert.deepEqual(cycleEligibility(yearly, closing("2027-03-28")), { due: true });
});

test("cycles before the start date are not started yet", () => {
  const future: FixedExpenseCycleInput = { ...base, startDate: closing("2026-11-01") };
  assert.deepEqual(cycleEligibility(future, closing("2026-09-28")), {
    due: false,
    reason: "NOT_STARTED",
  });
});

test("cycles after the end date are ended", () => {
  const ending: FixedExpenseCycleInput = { ...base, endDate: closing("2026-08-31") };
  assert.deepEqual(cycleEligibility(ending, closing("2026-09-28")), {
    due: false,
    reason: "ENDED",
  });
  assert.deepEqual(cycleEligibility(ending, closing("2026-08-28")), { due: true });
});

test("without startDate the anchor is the creation month", () => {
  const bimonthly: FixedExpenseCycleInput = { ...base, recurrenceMonths: 2 };
  assert.deepEqual(cycleEligibility(bimonthly, closing("2026-01-28")), { due: true });
  assert.deepEqual(cycleEligibility(bimonthly, closing("2026-02-28")), {
    due: false,
    reason: "OUT_OF_CYCLE",
  });
  assert.deepEqual(cycleEligibility(bimonthly, closing("2026-03-28")), { due: true });
});

test("expenseDateForInvoice uses the Brazilian day, not the UTC day, late at night", () => {
  mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-25T02:00:00.000Z") });
  try {
    const noDueDay: FixedExpenseCycleInput = { recurrenceMonths: 1, createdAt: closing("2026-01-05") };
    assert.deepEqual(expenseDateForInvoice(noDueDay, closing("2026-09-28")), closing("2026-09-24"));
  } finally {
    mock.timers.reset();
  }
});

test("brazilTodayIso reports the Brazilian day, not the UTC one", () => {
  assert.equal(brazilTodayIso(new Date("2026-09-25T02:00:00.000Z")), "2026-09-24");
  assert.equal(brazilTodayIso(new Date("2026-09-25T12:00:00.000Z")), "2026-09-25");
});
