import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { FamilyDetail, FamilyManageOverview, FamilySummary } from "@/api/types/family";

export async function fetchFamilies(): Promise<FamilySummary[]> {
  return api.get(apiPaths.families).json<FamilySummary[]>();
}

export async function fetchFamilyManageOverview(): Promise<FamilyManageOverview> {
  return api.get(apiPaths.familiesManage).json<FamilyManageOverview>();
}

export async function fetchFamilyDetail(familyId: number): Promise<FamilyDetail> {
  return api.get(apiPaths.family(familyId)).json<FamilyDetail>();
}
