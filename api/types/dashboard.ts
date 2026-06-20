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

export interface MedicationStatisticsDailyCompliance {
  readonly date: string;
  readonly takenCount: number;
  readonly totalCount: number;
  readonly fraction: string;
}

export type MedicationStatisticsIngredientRiskLevel = "CAUTION" | "DANGER";

export interface MedicationStatisticsCautionIngredient {
  readonly ingredientName: string;
  readonly monthlyIntakeCount: number;
  readonly riskLevel: MedicationStatisticsIngredientRiskLevel;
}

export interface MedicationStatisticsMonthlyAchievement {
  readonly message: string;
}

export interface MedicationStatisticsResponse {
  readonly startDate: string;
  readonly endDate: string;
  readonly totalScheduled: number;
  readonly totalTaken: number;
  readonly totalComplianceRate: number;
  readonly dailyCompliance: readonly MedicationStatisticsDailyCompliance[];
  // 통계 API 확장 필드. 서버 배포 순서상 이전 응답도 안전하게 처리한다.
  readonly cautionIngredients?: readonly MedicationStatisticsCautionIngredient[];
  readonly consultationMessage?: string;
  readonly monthlyAchievements?: readonly MedicationStatisticsMonthlyAchievement[];
}
