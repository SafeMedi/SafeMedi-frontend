import { useQuery } from "@tanstack/react-query";

import { fetchMedicationRecords, fetchMedicationStatistics } from "@/api/endpoints/medications";
import { queryKeys } from "@/api/query-keys";
import type { MedicationRecordsQueryType } from "@/api/types/medications";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 60 * 1000;

interface UseMedicationRecordsParams {
  readonly type: MedicationRecordsQueryType;
  readonly date: string;
  readonly familyId?: number;
  readonly enabled?: boolean;
}

interface UseMedicationDailyRecordsParams {
  readonly date: string;
  readonly familyId?: number;
  readonly enabled?: boolean;
}

export function useMedicationDailyRecords(params: UseMedicationDailyRecordsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);
  const isEnabled = params.enabled !== false && !!accessToken && params.date.length > 0;

  return useQuery({
    queryKey: queryKeys.medications.records("DAILY", params.date, params.familyId),
    enabled: isEnabled,
    staleTime: STALE_MS,
    queryFn: () =>
      fetchMedicationRecords({
        type: "DAILY",
        date: params.date,
        familyId: params.familyId,
      }),
  });
}

interface UseMedicationMonthlyRecordsParams {
  readonly date: string;
  readonly familyId?: number;
  readonly enabled?: boolean;
}

interface UseMedicationPeriodRecordsParams extends UseMedicationMonthlyRecordsParams {
  readonly type: "MONTH" | "WEEK";
}

function useMedicationPeriodRecords(params: UseMedicationPeriodRecordsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);
  const isEnabled = params.enabled !== false && !!accessToken && params.date.length > 0;

  return useQuery({
    queryKey: queryKeys.medications.records(params.type, params.date, params.familyId),
    enabled: isEnabled,
    staleTime: STALE_MS,
    queryFn: () =>
      fetchMedicationRecords({
        type: params.type,
        date: params.date,
        familyId: params.familyId,
      }),
  });
}

export function useMedicationMonthlyRecords(params: UseMedicationMonthlyRecordsParams) {
  return useMedicationPeriodRecords({ ...params, type: "MONTH" });
}

interface UseMedicationStatisticsParams {
  readonly startDate: string;
  readonly endDate: string;
  readonly enabled?: boolean;
}

export function useMedicationStatistics(params: UseMedicationStatisticsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);
  const isEnabled =
    params.enabled !== false &&
    !!accessToken &&
    params.startDate.length > 0 &&
    params.endDate.length > 0;

  return useQuery({
    queryKey: queryKeys.medications.statistics(params.startDate, params.endDate),
    enabled: isEnabled,
    staleTime: STALE_MS,
    queryFn: () =>
      fetchMedicationStatistics({ startDate: params.startDate, endDate: params.endDate }),
  });
}

export function useMedicationRecords(params: UseMedicationRecordsParams) {
  const isDaily = params.type === "DAILY";
  const isPeriod = params.type === "MONTH" || params.type === "WEEK";

  const dailyQuery = useMedicationDailyRecords({
    date: params.date,
    familyId: params.familyId,
    enabled: params.enabled !== false && isDaily,
  });

  const periodQuery = useMedicationPeriodRecords({
    type: isPeriod ? params.type : "MONTH",
    date: params.date,
    familyId: params.familyId,
    enabled: params.enabled !== false && isPeriod,
  });

  return isDaily ? dailyQuery : periodQuery;
}
