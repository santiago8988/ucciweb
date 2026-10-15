"use server";

import { getPropertiesByIds, MAX_FAVORITE_IDS } from "@/lib/queries";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public endpoint: validate shape and size before touching the database.
export async function fetchFavoriteProperties(ids: unknown) {
  if (!Array.isArray(ids)) return [];
  const valid = ids
    .filter((id): id is string => typeof id === "string" && UUID_RE.test(id))
    .slice(0, MAX_FAVORITE_IDS);
  return getPropertiesByIds(valid);
}
