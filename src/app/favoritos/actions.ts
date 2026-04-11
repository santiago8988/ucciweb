"use server";

import { getPropertiesByIds } from "@/lib/queries";

export async function fetchFavoriteProperties(ids: string[]) {
  return getPropertiesByIds(ids);
}
