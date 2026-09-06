import { prisma } from "@/lib/prisma";

export const SETTING_KEYS = {
  freeAnalysesCount: "freeAnalysesCount",
  monthlyAllowance: "monthlyAllowance",
  overagePriceCents: "overagePriceCents",
  oneOffPriceCents: "oneOffPriceCents",
  subscriptionPriceCents: "subscriptionPriceCents",
  rushSurchargeCents: "rushSurchargeCents",
} as const;

export const SETTING_DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.freeAnalysesCount]: "3",
  [SETTING_KEYS.monthlyAllowance]: "2",
  [SETTING_KEYS.overagePriceCents]: "15000",
  [SETTING_KEYS.oneOffPriceCents]: "25000",
  [SETTING_KEYS.subscriptionPriceCents]: "9900",
  [SETTING_KEYS.rushSurchargeCents]: "15000",
};

/** In-process cache so hot paths (order submission) don't hit the DB for every setting read within a request lifecycle. */
export async function getSetting(key: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? SETTING_DEFAULTS[key] ?? "";
}

export async function getSettingNumber(key: string): Promise<number> {
  const value = await getSetting(key);
  const num = Number(value);
  return Number.isFinite(num) ? num : Number(SETTING_DEFAULTS[key] ?? 0);
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const map = { ...SETTING_DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setSetting(key: string, value: string) {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
