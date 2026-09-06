import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SETTING_DEFAULTS } from "../src/lib/settings";

const prisma = new PrismaClient();

/**
 * The seed runs on every deploy, including against a publicly reachable
 * database, so it must never mint an admin account with a guessable password.
 * ADMIN_PASSWORD wins if set; otherwise development gets the documented
 * throwaway and anything else gets a random one printed once to the log.
 */
function initialAdminPassword(): { password: string; source: string } {
  const provided = process.env.ADMIN_PASSWORD;
  if (provided && provided.length >= 12) {
    return { password: provided, source: "ADMIN_PASSWORD" };
  }
  if (provided) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }
  if (process.env.NODE_ENV !== "production") {
    return { password: "changeme123", source: "development default" };
  }
  return { password: randomBytes(18).toString("base64url"), source: "randomly generated" };
}

async function main() {
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@site-brief.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const { password, source } = initialAdminPassword();
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "admin",
        emailVerified: new Date(),
      },
    });
    console.log(`Created admin user ${adminEmail}.`);
    console.log(`  Temporary password (${source}): ${password}`);
    console.log("  Sign in and change it immediately — this is the only time it is printed.");
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
