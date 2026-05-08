import { useQuery } from "@tanstack/react-query";

import {
  fetchDailyMedicationRecords,
  fetchMonthlyMedicationRecords,
} from "@/api/endpoints/dashboard";
import { queryKeys } from "@/api/query-keys";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 60 * 1000;

interface UseDashboardMedicationRecordsParams {
  readonly date: string;
}

export function useDashboardDailyMedicationRecords(params: UseDashboardMedicationRecordsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: queryKeys.dashboard.dailyMedicationRecords(params.date),
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: () => fetchDailyMedicationRecords({ date: params.date }),
  });
}

export function useDashboardMonthlyMedicationRecords(params: UseDashboardMedicationRecordsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: queryKeys.dashboard.monthlyMedicationRecords(params.date),
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: () => fetchMonthlyMedicationRecords({ date: params.date }),
  });
}
