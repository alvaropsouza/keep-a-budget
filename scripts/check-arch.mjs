import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const SRC = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

const FORBIDDEN_IN_CONTROLLER = [/\/services\/[\w-]+\.service/, /\/repositories\/[\w-]+\.repository/];

function walk(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, results);
    } else if (entry.endsWith(".controller.ts")) {
      results.push(full);
    }
  }
  return results;
}

const controllers = walk(SRC);
const violations = [];

for (const file of controllers) {
  const content = readFileSync(file, "utf-8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trimStart().startsWith("import")) continue;
    for (const pattern of FORBIDDEN_IN_CONTROLLER) {
      if (pattern.test(line)) {
        violations.push(`  ${relative(SRC, file)}:${i + 1}  →  ${line.trim()}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("\n[arch] Controllers must not import Services or Repositories directly.\n");
  console.error("       Use a UseCase instead (Controller → UseCase → Service/Repository).\n");
  for (const v of violations) console.error(v);
  console.error("");
  process.exit(1);
}

console.log(`[arch] OK — ${controllers.length} controller(s) checked, no violations.`);
