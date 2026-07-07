import { api } from "@/api/client";
import { fetchMedicationRecords, fetchMedicationStatistics } from "@/api/endpoints/medications";
import { apiPaths } from "@/api/paths";
import type {
  MedicationHistoryRecordsResponse,
  TodayMedicationSchedulesResponse,
  UpdateMedicationRecordRequest,
  UpdateMedicationRecordResponse,
} from "@/api/types/dashboard";
import type {
  DailyMedicationRecordsResponse,
  MedicationStatisticsResponse,
  MonthlyMedicationRecordsResponse,
} from "@/api/types/medications";

interface FetchMedicationRecordsParams {
  readonly date: string;
}

export async function fetchDailyMedicationRecords(
  params: FetchMedicationRecordsParams,
): Promise<DailyMedicationRecordsResponse> {
  return fetchMedicationRecords({ type: "DAILY", date: params.date });
}

export async function fetchTodayMedicationSchedules(): Promise<TodayMedicationSchedulesResponse> {
  return api.get(apiPaths.medicationRecordsToday).json<TodayMedicationSchedulesResponse>();
}

export async function updateMedicationRecord(
  recordId: number,
  body: UpdateMedicationRecordRequest,
): Promise<UpdateMedicationRecordResponse> {
  return api
    .patch(apiPaths.medicationRecord(recordId), { json: body })
    .json<UpdateMedicationRecordResponse>();
}

export async function fetchMonthlyMedicationRecords(
  params: FetchMedicationRecordsParams,
): Promise<MonthlyMedicationRecordsResponse> {
  return fetchMedicationRecords({ type: "MONTH", date: params.date });
}

export async function fetchMedicationHistoryRecords(
  params: FetchMedicationRecordsParams,
): Promise<MedicationHistoryRecordsResponse> {
  const monthlyRecords = await fetchMedicationRecords({ type: "MONTH", date: params.date });
  const selectedGroup = monthlyRecords.records.find((group) => group.date === params.date);

  return {
    date: params.date,
    items: selectedGroup?.items ?? [],
  };
}

export type { MedicationStatisticsResponse };
export { fetchMedicationStatistics };
