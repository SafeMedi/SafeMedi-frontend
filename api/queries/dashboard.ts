import { useQuery } from "@tanstack/react-query";

import {
  fetchDailyMedicationRecords,
  fetchMedicationHistoryRecords,
  fetchMedicationStatistics,
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

export function useDashboardMedicationHistoryRecords(params: UseDashboardMedicationRecordsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: queryKeys.dashboard.medicationHistoryRecords(params.date),
    enabled: !!accessToken && params.date.length > 0,
    staleTime: STALE_MS,
    queryFn: () => fetchMedicationHistoryRecords({ date: params.date }),
  });
}

interface UseMedicationStatisticsParams {
  readonly startDate: string;
  readonly endDate: string;
}

export function useMedicationStatistics(params: UseMedicationStatisticsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: queryKeys.dashboard.medicationStatistics(params.startDate, params.endDate),
    enabled: !!accessToken && params.startDate.length > 0 && params.endDate.length > 0,
    staleTime: STALE_MS,
    queryFn: () =>
      fetchMedicationStatistics({ startDate: params.startDate, endDate: params.endDate }),
  });
}
