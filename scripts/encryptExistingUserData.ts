import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { blindIndex, encryptField, isEncrypted } from "../src/utils/encryption";

// One-shot backfill: encrypt plaintext salary/rg left behind by the
// 20260617130000_encrypt_user_salary_rg migration. Safe to re-run — rows
// already encrypted are skipped via isEncrypted().
async function main(): Promise<void> {
  const users = await prisma.user.findMany();
  let updated = 0;

  for (const user of users) {
    const data: { salary?: string; rg?: string; rgHash?: string } = {};

    if (user.salary != null && !isEncrypted(user.salary)) {
      data.salary = encryptField(String(user.salary));
    }

    if (user.rg != null && !isEncrypted(user.rg)) {
      data.rg = encryptField(user.rg);
      data.rgHash = blindIndex(user.rg);
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: user.id }, data });
      updated += 1;
      console.log(`encrypted user ${user.id}`);
    }
  }

  console.log(`done: ${updated}/${users.length} users encrypted`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
