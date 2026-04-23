import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { FamilySummary } from "@/api/types/family";

export async function fetchFamilies(): Promise<FamilySummary[]> {
  return api.get(apiPaths.families).json<FamilySummary[]>();
}
