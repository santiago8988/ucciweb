import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { ORGANIZATION_ID } from "@/lib/env";
import { PROPERTIES_CACHE_TAG } from "@/lib/queries";

// Called by Supabase Database Webhooks (properties, property_images,
// property_videos, agents) so changes made in the agents' app show up at once.
// Auth: "Authorization: Bearer <REVALIDATE_SECRET>".
//
// Supabase payload: { type: "INSERT" | "UPDATE" | "DELETE", table, schema,
// record, old_record }.

type WebhookPayload = {
  table?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
};

function authorized(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header ?? "");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "Revalidation is not configured" }, { status: 503 });
  }
  if (!authorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: WebhookPayload = {};
  try {
    payload = (await request.json()) as WebhookPayload;
  } catch {
    // An empty or non-JSON body still means "something changed".
  }

  // The database is shared with other agencies: skip their listing changes.
  if (payload.table === "properties") {
    const orgs = [payload.record?.organization_id, payload.old_record?.organization_id];
    if (!orgs.includes(ORGANIZATION_ID)) {
      return Response.json({ revalidated: false, reason: "other organization" });
    }
  }

  // Webhooks come from outside a Server Action: expire immediately.
  revalidateTag(PROPERTIES_CACHE_TAG, { expire: 0 });
  return Response.json({ revalidated: true, table: payload.table ?? null });
}
