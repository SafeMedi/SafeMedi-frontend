export type MedicationRecordStatus = "SUCCESS" | "OVERDUE" | "DUE" | "UPCOMING";

export interface DailyMedicationSummary {
  readonly totalCount: number;
  readonly takenCount: number;
  readonly fraction: string;
}

export interface DailyMedicationRecordItem {
  readonly recordId: number;
  readonly prescriptionTitle: string;
  readonly medicationNames: readonly string[];
  readonly scheduledTime: string;
  readonly takenTime: string | null;
  readonly status: MedicationRecordStatus;
  readonly isGoldenTime: boolean;
}

export interface DailyMedicationRecordsResponse {
  readonly date: string;
  readonly currentTime: string;
  readonly summary: DailyMedicationSummary;
  readonly records: readonly DailyMedicationRecordItem[];
}

export interface MonthlyMedicationSummary {
  readonly totalCount: number;
  readonly takenCount: number;
  readonly fraction: string;
  readonly successRate: number;
}

export interface MonthlyMedicationRecordItem {
  readonly recordId: number;
  readonly prescriptionTitle: string;
  readonly medicationNames: readonly string[];
  readonly scheduledTime: string;
  readonly takenTime: string | null;
  readonly status: MedicationRecordStatus;
  readonly warningMessages?: readonly string[];
}

export interface MonthlyMedicationRecordGroup {
  readonly date: string;
  readonly items: readonly MonthlyMedicationRecordItem[];
}

export interface MonthlyMedicationRecordsResponse {
  readonly period: string;
  readonly summary: MonthlyMedicationSummary;
  readonly records: readonly MonthlyMedicationRecordGroup[];
}

export interface MedicationHistoryRecordsResponse {
  readonly date: string;
  readonly items: readonly MonthlyMedicationRecordItem[];
}
