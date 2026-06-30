import { useMemo } from "react";

import { useDashboardTodayMedicationSchedules } from "@/api/queries/dashboard";
import { usePrescriptionsQuery } from "@/api/queries/prescriptions";
import type { TodayMedicationScheduleStatus } from "@/api/types";

type DashboardScheduleTone = "success" | "required" | "upcoming";

export interface DashboardScheduleCardItem {
  readonly id: string;
  readonly scheduledTime: string;
  readonly prescriptionCount: number;
  readonly prescriptionTitle: string;
  readonly medicationCount: number;
  readonly medicationNames: readonly string[];
  readonly statusLabel: string;
  readonly tone: DashboardScheduleTone;
}

export interface DashboardRecentPrescriptionItem {
  readonly id: string;
  readonly prescriptionId: number;
  readonly dateLabel: string;
  readonly analysisCount: number;
  readonly hasWarning: boolean;
}

export interface DashboardViewModel {
  readonly adherenceRate: number;
  readonly adherenceSummaryText: string;
  readonly scheduleRemainingCount: number;
  readonly scheduleCards: readonly DashboardScheduleCardItem[];
  readonly recentPrescriptions: readonly DashboardRecentPrescriptionItem[];
  readonly healthTipTitle: string;
  readonly healthTipDescription: string;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => Promise<unknown>;
}

function resolveScheduleTone(status: TodayMedicationScheduleStatus): DashboardScheduleTone {
  if (status === "SUCCESS") return "success";
  if (status === "NEED_TAKE" || status === "MISSED") return "required";
  return "upcoming";
}

function resolveStatusLabel(status: TodayMedicationScheduleStatus): string {
  if (status === "SUCCESS") return "완료";
  if (status === "NEED_TAKE") return "복용 필요";
  if (status === "MISSED") return "미복용";
  if (status === "SKIP") return "건너뜀";
  return "대기중";
}

export function useDashboardViewModel(): DashboardViewModel {
  const todayScheduleQuery = useDashboardTodayMedicationSchedules();
  const prescriptionsQuery = usePrescriptionsQuery();
  const prescriptions = prescriptionsQuery.data?.prescriptions ?? [];

  const adherenceRate = Math.round(todayScheduleQuery.data?.summary.completionRate ?? 0);
  const adherenceSummaryText = todayScheduleQuery.data?.summary
    ? `${todayScheduleQuery.data.summary.completedCount} / ${todayScheduleQuery.data.summary.totalCount} 완료`
    : "0 / 0 완료";

  const scheduleCards = useMemo<readonly DashboardScheduleCardItem[]>(() => {
    if (!todayScheduleQuery.data) return [];
    return todayScheduleQuery.data.schedules.map((schedule) => ({
      id: `${schedule.prescriptionId}-${schedule.takeTime}-${schedule.recordIds.join("-")}`,
      scheduledTime: schedule.takeTime,
      prescriptionCount: 1,
      prescriptionTitle: schedule.prescriptionTitle,
      medicationCount: schedule.drugCount,
      medicationNames:
        prescriptions
          .find((prescription) => prescription.prescriptionId === schedule.prescriptionId)
          ?.medications.filter((medication) => medication.takeTimes.includes(schedule.takeTime))
          .map((medication) => medication.drugName) ?? [],
      statusLabel: resolveStatusLabel(schedule.status),
      tone: resolveScheduleTone(schedule.status),
    }));
  }, [prescriptions, todayScheduleQuery.data]);

  const scheduleRemainingCount = useMemo(() => {
    return scheduleCards.filter((card) => card.tone !== "success").length;
  }, [scheduleCards]);

  const recentPrescriptions = useMemo<readonly DashboardRecentPrescriptionItem[]>(() => {
    return prescriptions.slice(0, 3).map((prescription) => ({
      id: String(prescription.prescriptionId),
      prescriptionId: prescription.prescriptionId,
      dateLabel: prescription.title,
      analysisCount: prescription.drugCount ?? prescription.medications.length,
      hasWarning:
        prescription.hasAllergyConflict ?? prescription.medications.some((item) => item.hasWarning),
    }));
  }, [prescriptions]);

  const refetch = async () =>
    Promise.all([todayScheduleQuery.refetch(), prescriptionsQuery.refetch()]);

  return {
    adherenceRate,
    adherenceSummaryText,
    scheduleRemainingCount,
    scheduleCards,
    recentPrescriptions,
    healthTipTitle: "건강 팁",
    healthTipDescription:
      "약은 충분한 물과 함께 복용하세요. 최소 200ml(컵 1잔) 이상의 물과 함께 드시면 효과가 더 좋아요.",
    isLoading: todayScheduleQuery.isLoading || prescriptionsQuery.isLoading,
    isError: todayScheduleQuery.isError || prescriptionsQuery.isError,
    refetch,
  };
}
