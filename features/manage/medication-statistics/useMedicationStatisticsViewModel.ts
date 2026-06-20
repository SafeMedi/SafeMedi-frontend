import { useMemo } from "react";

import { useMedicationStatistics as useMedicationStatisticsQuery } from "@/api/queries/dashboard";
import {
  buildMedicationReportWeeklyCompliance,
  getMedicationReportMonthRange,
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
  const monthRange = useMemo(() => getMedicationReportMonthRange(today), [today]);
  const weeklyStatisticsQuery = useMedicationStatisticsQuery({
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
  });
  const monthlyStatisticsQuery = useMedicationStatisticsQuery({
    startDate: monthRange.startDate,
    endDate: monthRange.endDate,
  });

  const weeklyCompliance = useMemo(
    () =>
      buildMedicationReportWeeklyCompliance(
        weeklyStatisticsQuery.data?.dailyCompliance ?? [],
        weekRange.weekStart,
        today,
      ),
    [today, weekRange.weekStart, weeklyStatisticsQuery.data?.dailyCompliance],
  );

  const cautionIngredients = useMemo(
    () =>
      mapMedicationReportCautionIngredients(monthlyStatisticsQuery.data?.cautionIngredients ?? []),
    [monthlyStatisticsQuery.data?.cautionIngredients],
  );

  const consultationMessage = useMemo(
    () => resolveMedicationReportConsultationMessage(monthlyStatisticsQuery.data),
    [monthlyStatisticsQuery.data],
  );

  const monthlyAchievements = useMemo(
    () => mapMedicationReportMonthlyAchievements(monthlyStatisticsQuery.data),
    [monthlyStatisticsQuery.data],
  );

  return {
    weeklyCompliance,
    cautionIngredients,
    consultationMessage,
    monthlyAchievements,
    isLoading: weeklyStatisticsQuery.isLoading || monthlyStatisticsQuery.isLoading,
    isError: weeklyStatisticsQuery.isError || monthlyStatisticsQuery.isError,
    refetch: async () => {
      await Promise.all([weeklyStatisticsQuery.refetch(), monthlyStatisticsQuery.refetch()]);
    },
  };
}
