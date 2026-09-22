import { requireAgent } from "@/lib/session";
import { ProfileForm } from "@/components/ProfileForm";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ProfilePage() {
  const user = await requireAgent();
  const p = user.brokerProfile;

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Broker profile</h1>
      <p className="mt-1 text-sm text-graystone">This information appears on every report you order.</p>
      <div className="mt-8">
        <ProfileForm
          initial={{
            fullName: p?.fullName ?? "",
            licenseNumber: p?.licenseNumber ?? "",
            brokerage: p?.brokerage ?? "",
            officeAddress: p?.officeAddress ?? "",
            phone: p?.phone ?? "",
            email: p?.email ?? user.email,
            website: p?.website ?? "",
            reportLanguage: (p?.reportLanguage as "en" | "pt") ?? "en",
            headshotKey: p?.headshotKey ?? null,
            logoKey: p?.logoKey ?? null,
          }}
        />
      </div>

      <h2 className="mt-14 font-serif text-2xl text-navy">Password</h2>
      <p className="mt-1 text-sm text-graystone">Signed in as {user.email}.</p>
      <div className="mt-8">
        <ChangePasswordForm hasPassword={Boolean(user.passwordHash)} />
      </div>
    </div>
  );
}
