import type {
  MedicationStatisticsCautionIngredient,
  MedicationStatisticsDailyCompliance,
  MedicationStatisticsIngredientRiskLevel,
  MedicationStatisticsResponse,
} from "@/api/types/dashboard";

export type MedicationReportWeeklyComplianceTone = "success" | "warning" | "future";

export interface MedicationReportWeeklyComplianceItem {
  readonly dayLabel: string;
  readonly rate: number | null;
  readonly tone: MedicationReportWeeklyComplianceTone;
}

export interface MedicationReportCautionIngredientItem {
  readonly id: string;
  readonly name: string;
  readonly monthlyIntakeCount: number;
  readonly riskLevel: MedicationStatisticsIngredientRiskLevel;
  readonly riskLabel: string;
}

const WEEKDAY_FULL_LABELS = [
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
  "일요일",
] as const;

function formatDateToApiParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 0;
  return Math.max(0, Math.min(100, Math.round(rate)));
}

function resolveWeeklyComplianceTone(rate: number): MedicationReportWeeklyComplianceTone {
  return rate >= 90 ? "success" : "warning";
}

function resolveRiskLabel(riskLevel: MedicationStatisticsIngredientRiskLevel): string {
  return riskLevel === "DANGER" ? "위험" : "주의";
}

function buildCautionIngredientId(ingredient: MedicationStatisticsCautionIngredient): string {
  return `${ingredient.ingredientName}-${ingredient.riskLevel}-${ingredient.monthlyIntakeCount}`;
}

export function getMedicationReportWeekRange(today: Date): {
  readonly startDate: string;
  readonly endDate: string;
  readonly weekStart: Date;
} {
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(today.getDate() + diffToMonday);

  return {
    startDate: formatDateToApiParam(weekStart),
    endDate: formatDateToApiParam(today),
    weekStart,
  };
}

export function getMedicationReportMonthRange(today: Date): {
  readonly startDate: string;
  readonly endDate: string;
} {
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    startDate: formatDateToApiParam(monthStart),
    endDate: formatDateToApiParam(today),
  };
}

export function buildMedicationReportWeeklyCompliance(
  dailyCompliance: readonly MedicationStatisticsDailyCompliance[],
  weekStart: Date,
  today: Date,
): readonly MedicationReportWeeklyComplianceItem[] {
  const complianceByDate = new Map(dailyCompliance.map((entry) => [entry.date, entry]));
  const todayText = formatDateToApiParam(today);

  return WEEKDAY_FULL_LABELS.map((dayLabel, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateText = formatDateToApiParam(date);
    const entry = complianceByDate.get(dateText);

    if (dateText > todayText) {
      return {
        dayLabel,
        rate: null,
        tone: "future" as const,
      };
    }

    if (!entry || entry.totalCount === 0) {
      return {
        dayLabel,
        rate: 0,
        tone: "warning" as const,
      };
    }

    const rate = clampRate((entry.takenCount / entry.totalCount) * 100);
    return {
      dayLabel,
      rate,
      tone: resolveWeeklyComplianceTone(rate),
    };
  });
}

export function mapMedicationReportCautionIngredients(
  ingredients: readonly MedicationStatisticsCautionIngredient[],
): readonly MedicationReportCautionIngredientItem[] {
  return ingredients.map((ingredient) => ({
    id: buildCautionIngredientId(ingredient),
    name: ingredient.ingredientName,
    monthlyIntakeCount: ingredient.monthlyIntakeCount,
    riskLevel: ingredient.riskLevel,
    riskLabel: resolveRiskLabel(ingredient.riskLevel),
  }));
}

export function mapMedicationReportMonthlyAchievements(
  statistics: MedicationStatisticsResponse | undefined,
): readonly string[] {
  return statistics?.monthlyAchievements?.map((achievement) => achievement.message) ?? [];
}

export function resolveMedicationReportConsultationMessage(
  statistics: MedicationStatisticsResponse | undefined,
): string | null {
  const message = statistics?.consultationMessage?.trim();
  return message && message.length > 0 ? message : null;
}
