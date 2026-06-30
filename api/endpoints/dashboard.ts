import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  DailyMedicationRecordsResponse,
  MedicationHistoryRecordsResponse,
  MedicationStatisticsResponse,
  MonthlyMedicationRecordsResponse,
  TodayMedicationSchedulesResponse,
} from "@/api/types/dashboard";

interface FetchMedicationRecordsParams {
  readonly date: string;
}

export async function fetchDailyMedicationRecords(
  params: FetchMedicationRecordsParams,
): Promise<DailyMedicationRecordsResponse> {
  return api
    .get(apiPaths.medicationRecords, {
      searchParams: { type: "DAILY", date: params.date },
    })
    .json<DailyMedicationRecordsResponse>();
}

export async function fetchTodayMedicationSchedules(): Promise<TodayMedicationSchedulesResponse> {
  return api.get(apiPaths.medicationRecordsToday).json<TodayMedicationSchedulesResponse>();
}

export async function fetchMonthlyMedicationRecords(
  params: FetchMedicationRecordsParams,
): Promise<MonthlyMedicationRecordsResponse> {
  return api
    .get(apiPaths.medicationRecords, {
      searchParams: { type: "MONTH", date: params.date },
    })
    .json<MonthlyMedicationRecordsResponse>();
}

export async function fetchMedicationHistoryRecords(
  params: FetchMedicationRecordsParams,
): Promise<MedicationHistoryRecordsResponse> {
  const monthlyRecords = await fetchMonthlyMedicationRecords(params);
  const selectedGroup = monthlyRecords.records.find((group) => group.date === params.date);

  return {
    date: params.date,
    items: selectedGroup?.items ?? [],
  };
}

interface FetchMedicationStatisticsParams {
  readonly startDate: string;
  readonly endDate: string;
}

export async function fetchMedicationStatistics(
  params: FetchMedicationStatisticsParams,
): Promise<MedicationStatisticsResponse> {
  return api
    .get(apiPaths.medicationsStatistics, {
      searchParams: { startDate: params.startDate, endDate: params.endDate },
    })
    .json<MedicationStatisticsResponse>();
}
