import "server-only";
import { db } from "./db";

export async function audit(
  actorType: "staff" | "participant" | "juror" | "system",
  actorId: string | null,
  action: string,
  entity?: string,
  entityId?: string,
  data?: Record<string, unknown>,
) {
  await db()`
    insert into hnh.audit_log (actor_type, actor_id, action, entity, entity_id, data)
    values (${actorType}, ${actorId}, ${action}, ${entity ?? null}, ${entityId ?? null}, ${data ? db().json(data as never) : null})`;
}
