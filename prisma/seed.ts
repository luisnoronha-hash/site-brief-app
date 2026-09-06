import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SETTING_DEFAULTS } from "../src/lib/settings";

const prisma = new PrismaClient();

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
    const passwordHash = await bcrypt.hash("changeme123", 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "admin",
        emailVerified: new Date(),
      },
    });
    console.log(`Created admin user ${adminEmail} with temporary password "changeme123". Change it immediately.`);
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
