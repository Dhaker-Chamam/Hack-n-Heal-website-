import { audit } from "@/lib/audit";
import { listRegistrations } from "@/lib/admin-queries";
import { csvResponse, toCsv } from "@/lib/csv";
import { PROFILE_KIND_LABEL, specialityLabel } from "@/lib/constants";
import { currentStaff } from "@/lib/session";
import { tunisDay, tunisStamp } from "@/lib/time";

const STATUS: Record<string, string> = {
  pending: "en attente",
  confirmed: "confirmée",
  cancelled: "annulée",
  rejected: "refusée",
};

export async function GET(req: Request) {
  const staff = await currentStaff();
  if (!staff || staff.role !== "admin") return new Response("Non autorisé", { status: 403 });
  const p = new URL(req.url).searchParams;
  const rows = await listRegistrations({
    q: p.get("q") ?? undefined,
    competition: (p.get("competition") as "medical") ?? undefined,
    status: p.get("status") ?? undefined,
    profile: p.get("profile") ?? undefined,
    tag: p.getAll("tag"),
    sans_equipe: p.get("sans_equipe") ?? undefined,
  });
  await audit("staff", staff.id, "export.registrations", undefined, undefined, { rows: rows.length });
  const body = toCsv(
    [
      "code_participant", "prenom", "nom", "email", "telephone", "etablissement", "niveau", "profil", "type_profil",
      "statut", "medical", "equipe_medical", "code_medical", "bioinfo", "equipe_bioinfo", "code_bioinfo",
      "kaggle", "ordinateur", "sans_photo", "offres_stage", "cv", "cv_partage", "inscrit_le", "confirme_le", "facebook",
    ],
    rows.map((r) => [
      r.participant_code, r.first_name, r.last_name, r.email, r.phone, r.institution, r.study_level,
      r.specialities.map(specialityLabel).join(" | "),
      PROFILE_KIND_LABEL[r.profile_kind], STATUS[r.status], r.medical_in, r.medical_team, r.medical_code, r.bioinfo_in,
      r.bioinfo_team, r.bioinfo_code, r.kaggle_username, r.has_laptop, r.photo_opt_out, r.internship_offers_opt_in,
      r.has_cv, r.cv_share_opt_in, tunisStamp(r.created_at), tunisStamp(r.email_confirmed_at), r.facebook,
    ]),
  );
  return csvResponse(`hacknheal-inscriptions-${tunisDay()}.csv`, body);
}
