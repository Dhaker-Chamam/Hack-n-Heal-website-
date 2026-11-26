import { after } from "next/server";
import { redirect } from "next/navigation";
import type { Competition } from "@/lib/constants";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { teammateJoinedEmail, welcomeEmail } from "@/lib/emails";
import { myParticipations } from "@/lib/participant";
import { rateLimit } from "@/lib/ratelimit";
import { ipHash } from "@/lib/request";
import { personByToken, setParticipantCookie } from "@/lib/session";
import { formatMissing } from "@/lib/teams";

/**
 * Personal link. Confirms the email on first use, swaps the token for an
 * httpOnly cookie and redirects so the token leaves the address bar.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!(await rateLimit(`access:ip:${await ipHash()}`, 30, 600))) redirect("/lien?raison=limite");
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) redirect("/lien?raison=invalide");

  const person = await personByToken(token);
  if (!person) redirect("/lien?raison=invalide");
  if (person.status === "rejected") redirect("/lien?raison=refusee");

  await setParticipantCookie(token);

  if (person.status === "pending") {
    const [confirmed] = await db()<{ id: string }[]>`
      update hnh.person set status = 'confirmed', email_confirmed_at = now(), updated_at = now()
      where id = ${person.id} and status = 'pending' returning id`;
    if (confirmed) {
      const parts = await myParticipations(person.id);
      // an author of The Wall who takes part in no hackathon: no QR code, straight to the publishing page
      if (Object.keys(parts).length === 0) redirect("/the-wall/publier");
      after(async () => {
        const teams = (Object.keys(parts) as Competition[]).map((c) => ({
          competition: c,
          teamName: parts[c]!.team?.name ?? null,
          code: parts[c]!.team?.join_code ?? null,
          seeking: parts[c]!.seeking_team,
        }));
        await sendMail({
          personId: person.id,
          to: person.email,
          template: "welcome",
          withQr: true,
          ...welcomeEmail(person.first_name, token, teams),
        });
        // Tell team leads that a new member's seat is now confirmed
        for (const c of Object.keys(parts) as Competition[]) {
          const team = parts[c]!.team;
          if (!team || parts[c]!.isLead || !team.lead_participation_id) continue;
          const [lead] = await db()<{ id: string; email: string; first_name: string }[]>`
            select p.id, p.email, p.first_name from hnh.participation pa join hnh.person p on p.id = pa.person_id
            where pa.id = ${team.lead_participation_id} and p.status = 'confirmed'`;
          if (!lead) continue;
          const missing = formatMissing(team.balance.missing);
          await sendMail({
            personId: lead.id,
            to: lead.email,
            template: "teammate_joined",
            ...teammateJoinedEmail(lead.first_name, team.name, `${person.first_name} ${person.last_name}`, missing),
          });
        }
      });
      redirect(`/moi?bienvenue=1`);
    }
  }
  redirect("/moi");
}
