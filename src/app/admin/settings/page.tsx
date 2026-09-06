import { getAllSettings, SETTING_KEYS } from "@/lib/settings";
import { SettingsForm } from "@/components/SettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Pricing settings</h1>
      <p className="mt-1 text-sm text-graystone">Changes apply to the next order submitted — no deployment required.</p>
      <div className="mt-8">
        <SettingsForm
          initial={{
            freeAnalysesCount: settings[SETTING_KEYS.freeAnalysesCount],
            monthlyAllowance: settings[SETTING_KEYS.monthlyAllowance],
            overagePriceCents: settings[SETTING_KEYS.overagePriceCents],
            oneOffPriceCents: settings[SETTING_KEYS.oneOffPriceCents],
            subscriptionPriceCents: settings[SETTING_KEYS.subscriptionPriceCents],
            rushSurchargeCents: settings[SETTING_KEYS.rushSurchargeCents],
          }}
        />
      </div>
    </div>
  );
}
