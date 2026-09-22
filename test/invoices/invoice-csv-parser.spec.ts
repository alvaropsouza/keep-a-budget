import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInvoiceCsv } from "../../src/utils/invoice-csv-parser";

test("XP rows with an unreadable amount are skipped instead of poisoning the invoice", () => {
  const csv = [
    "data;descricao;categoria;valor;parcela",
    "10/09/2026;Mercado;Alimentação;R$ 150,00;",
    "11/09/2026;Linha quebrada;Outros;;",
    "12/09/2026;Farmácia;Saúde;R$ 30,50;1 de 3",
  ].join("\n");

  const rows = parseInvoiceCsv("XP", csv);

  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((r) => r.amount),
    [150, 30.5],
  );
  assert.deepEqual(rows[1].installment, { current: 1, total: 3 });
});

test("Nubank amounts quoted with a decimal comma are parsed whole", () => {
  const csv = ["date,title,amount", '2026-09-10,Padaria,"214,89"', "2026-09-11,Uber,35.20"].join("\n");

  const rows = parseInvoiceCsv("NUBANK", csv);

  assert.deepEqual(
    rows.map((r) => r.amount),
    [214.89, 35.2],
  );
  assert.equal(rows[0].date.toISOString(), "2026-09-10T00:00:00.000Z");
});
