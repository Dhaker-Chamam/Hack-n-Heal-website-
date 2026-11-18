import { AdminBand } from "@/components/admin-band";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { currentStaff } from "@/lib/session";
import { requestStaffLink } from "./actions";
import { StaffLoginForm } from "./staff-login-form";

export const metadata: Metadata = { title: "Connexion organisateurs" };

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (await currentStaff()) redirect("/admin");
  const { raison } = await searchParams;
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AdminBand />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        <h1 className="t-headline">Connexion</h1>
        <p className="mt-3 text-graphite">Un lien de connexion à usage unique est envoyé à ton adresse.</p>
        {raison && (
          <div className="mt-6">
            <Alert tone="error" title={raison === "expire" ? "Ce lien de connexion a expiré ou a déjà servi." : "Connecte-toi pour continuer."} />
          </div>
        )}
        <div className="mt-8">
          <StaffLoginForm action={requestStaffLink} />
        </div>
      </main>
    </div>
  );
}
