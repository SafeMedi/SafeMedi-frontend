import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  DailyMedicationRecordsResponse,
  MonthlyMedicationRecordsResponse,
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

export async function fetchMonthlyMedicationRecords(
  params: FetchMedicationRecordsParams,
): Promise<MonthlyMedicationRecordsResponse> {
  return api
    .get(apiPaths.medicationRecords, {
      searchParams: { type: "MONTH", date: params.date },
    })
    .json<MonthlyMedicationRecordsResponse>();
}
