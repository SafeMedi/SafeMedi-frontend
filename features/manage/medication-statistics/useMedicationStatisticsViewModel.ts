import { useMemo } from "react";

import { useMedicationStatistics as useMedicationStatisticsQuery } from "@/api/queries/dashboard";
import {
  buildMedicationReportWeeklyCompliance,
  getMedicationReportWeekRange,
  type MedicationReportCautionIngredientItem,
  type MedicationReportWeeklyComplianceItem,
  mapMedicationReportCautionIngredients,
  mapMedicationReportMonthlyAchievements,
  resolveMedicationReportConsultationMessage,
} from "./medicationReportStatistics";

export interface MedicationStatisticsViewModel {
  readonly weeklyCompliance: readonly MedicationReportWeeklyComplianceItem[];
  readonly cautionIngredients: readonly MedicationReportCautionIngredientItem[];
  readonly consultationMessage: string | null;
  readonly monthlyAchievements: readonly string[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => Promise<unknown>;
}

export function useMedicationStatisticsViewModel(
  today = new Date(),
): MedicationStatisticsViewModel {
  const weekRange = useMemo(() => getMedicationReportWeekRange(today), [today]);
  const statisticsQuery = useMedicationStatisticsQuery({
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
  });

  const weeklyCompliance = useMemo(
    () =>
      buildMedicationReportWeeklyCompliance(
        statisticsQuery.data?.dailyCompliance ?? [],
        weekRange.weekStart,
      ),
    [statisticsQuery.data?.dailyCompliance, weekRange.weekStart],
  );

  const cautionIngredients = useMemo(
    () => mapMedicationReportCautionIngredients(statisticsQuery.data?.cautionIngredients ?? []),
    [statisticsQuery.data?.cautionIngredients],
  );

  const consultationMessage = useMemo(
    () => resolveMedicationReportConsultationMessage(statisticsQuery.data),
    [statisticsQuery.data],
  );

  const monthlyAchievements = useMemo(
    () => mapMedicationReportMonthlyAchievements(statisticsQuery.data),
    [statisticsQuery.data],
  );

  return {
    weeklyCompliance,
    cautionIngredients,
    consultationMessage,
    monthlyAchievements,
    isLoading: statisticsQuery.isLoading,
    isError: statisticsQuery.isError,
    refetch: () => statisticsQuery.refetch(),
  };
}
