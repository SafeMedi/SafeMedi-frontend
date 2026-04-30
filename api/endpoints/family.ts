import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { FamilyManageOverview, FamilySummary } from "@/api/types/family";

export async function fetchFamilies(): Promise<FamilySummary[]> {
  return api.get(apiPaths.families).json<FamilySummary[]>();
}

export async function fetchFamilyManageOverview(): Promise<FamilyManageOverview> {
  return api.get(apiPaths.familiesManage).json<FamilyManageOverview>();
}
