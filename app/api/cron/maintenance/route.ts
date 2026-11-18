import { safeEqual } from "@/lib/crypto";
import { runMaintenance } from "@/lib/maintenance";

/** Daily housekeeping, called by Vercel Cron with "Authorization: Bearer $CRON_SECRET". */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return new Response("Non autorisé", { status: 401 });
  await runMaintenance(true);
  return Response.json({ ok: true });
}
