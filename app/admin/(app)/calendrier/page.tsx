import type { Metadata } from "next";
import { SimpleActionForm } from "@/components/forms/simple-action-form";
import { StatusMarker } from "@/components/ui/markers";
import { requireStaff } from "@/lib/admin";
import { formatDeadline, formatMoment, toTunisInput } from "@/lib/time";
import { getWindows } from "@/lib/windows";
import { updateWindow } from "./actions";

export const metadata: Metadata = { title: "Calendrier" };

export default async function CalendarPage() {
  await requireStaff("admin");
  const at = (d: Date | null) => d?.getTime() ?? Number.POSITIVE_INFINITY;
  const windows = Object.values(await getWindows()).sort(
    (a, b) => Math.min(at(a.closes_at), at(a.opens_at)) - Math.min(at(b.closes_at), at(b.opens_at)),
  );
  const now = new Date();
  return (
    <div>
      <h1 className="t-headline">Calendrier</h1>
      <p className="mt-2 max-w-measure text-graphite">
        Toutes les heures sont celles de Tunis. La fermeture est exclusive : une fermeture le 27 novembre à 00:00
        s&apos;affiche « jusqu&apos;au jeudi 26 novembre à 23:59 ». Le serveur applique ces fenêtres à chaque envoi de
        formulaire.
      </p>
      <ul className="mt-8 border-b border-jade/15">
        {windows.map((w) => (
          <li key={w.key} className="grid gap-4 border-t border-jade/15 py-6 lg:grid-cols-[18rem_1fr]">
            <div>
              <StatusMarker done={w.is_open}>
                <span className="font-semibold text-ink">{w.label}</span>
              </StatusMarker>
              <p className="mt-1 text-small text-graphite">
                {w.is_open ? "Ouverte" : "Fermée"}
                {w.manual_state === "auto" && w.is_open && w.closes_at && ` jusqu'au ${formatDeadline(w.closes_at)}`}
                {w.manual_state === "auto" && !w.is_open && w.opens_at && w.opens_at > now && ` · ouvre le ${formatMoment(w.opens_at)}`}
                {w.manual_state !== "auto" && " · forcée à la main"}
              </p>
              <p className="tabular mt-1 text-small text-graphite">{w.key}</p>
            </div>
            <SimpleActionForm action={updateWindow.bind(null, w.key)} submitLabel="Enregistrer" variant="secondary" size="sm" inline>
              <div>
                <label htmlFor={`${w.key}-o`} className="block text-small font-semibold text-ink">
                  Ouverture
                </label>
                <input id={`${w.key}-o`} type="datetime-local" name="opens_at" defaultValue={toTunisInput(w.opens_at)} className="control mt-1 min-h-10! py-2!" />
              </div>
              <div>
                <label htmlFor={`${w.key}-c`} className="block text-small font-semibold text-ink">
                  Fermeture
                </label>
                <input id={`${w.key}-c`} type="datetime-local" name="closes_at" defaultValue={toTunisInput(w.closes_at)} className="control mt-1 min-h-10! py-2!" />
              </div>
              <div>
                <label htmlFor={`${w.key}-m`} className="block text-small font-semibold text-ink">
                  Mode
                </label>
                <select id={`${w.key}-m`} name="manual_state" defaultValue={w.manual_state} className="control mt-1 min-h-10! py-2!">
                  <option value="auto">Selon les dates</option>
                  <option value="open">Forcer ouverte</option>
                  <option value="closed">Forcer fermée</option>
                </select>
              </div>
            </SimpleActionForm>
          </li>
        ))}
      </ul>
    </div>
  );
}
