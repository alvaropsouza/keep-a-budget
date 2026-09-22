import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeFileSegment } from "../../src/use-cases/expenses/export-ir-zip.use-case";

test("path separators in a category never create folders inside the zip", () => {
  assert.equal(sanitizeFileSegment("Saúde/Plano"), "Saúde-Plano");
  assert.equal(sanitizeFileSegment("Notas" + String.fromCharCode(92) + "Fiscais"), "Notas-Fiscais");
  assert.equal(sanitizeFileSegment('Aluguel: "casa"?'), "Aluguel- -casa--");
});

test("an empty category falls back to a stable name", () => {
  assert.equal(sanitizeFileSegment("   "), "sem-categoria");
});
