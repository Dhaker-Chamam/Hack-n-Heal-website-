import { qrPayload, qrPng } from "@/lib/qr";
import { currentPerson } from "@/lib/session";

export async function GET() {
  const person = await currentPerson();
  if (!person) return new Response("Non autorisé", { status: 401 });
  const png = await qrPng(qrPayload(person.id));
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="hacknheal-qr-${person.participant_code}.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
