import { AdminBand } from "@/components/admin-band";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { consumeStaffLogin } from "./actions";

export const metadata: Metadata = { title: "Connexion organisateurs" };

/**
 * The link only opens this page; the login happens on the button press.
 * Mail scanners that pre-open links therefore cannot burn the one-time token.
 */
export default async function StaffAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AdminBand />
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-16">
        <h1 className="t-headline">Connexion</h1>
        <p className="mt-3 text-graphite">Confirme la connexion sur cet appareil. La session dure 14 jours.</p>
        <form action={consumeStaffLogin.bind(null, token)} className="mt-8">
          <Button type="submit">Me connecter</Button>
        </form>
      </main>
    </div>
  );
}
