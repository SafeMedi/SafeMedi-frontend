import { useMemo } from "react";

import { useDashboardTodayMedicationSchedules } from "@/api/queries/dashboard";
import type { TodayMedicationScheduleStatus } from "@/api/types";

const LOCALE_DATE_FORMAT_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
} as const;

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

function formatDateLabel(dateText: string): string {
  const parsedDate = new Date(dateText);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateText;
  }
  return parsedDate.toLocaleDateString("ko-KR", LOCALE_DATE_FORMAT_OPTIONS).replace(/\.$/, "");
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
      medicationNames: [],
      statusLabel: resolveStatusLabel(schedule.status),
      tone: resolveScheduleTone(schedule.status),
    }));
  }, [todayScheduleQuery.data]);

  const scheduleRemainingCount = useMemo(() => {
    return scheduleCards.filter((card) => card.tone !== "success").length;
  }, [scheduleCards]);

  const recentPrescriptions = useMemo<readonly DashboardRecentPrescriptionItem[]>(() => {
    const responseDate = todayScheduleQuery.data?.date;
    if (!responseDate || scheduleCards.length === 0) return [];

    return [
      {
        id: responseDate,
        dateLabel: formatDateLabel(responseDate),
        analysisCount: scheduleCards.reduce((sum, card) => sum + card.medicationCount, 0),
        hasWarning: scheduleCards.some((card) => card.tone === "required"),
      },
    ];
  }, [scheduleCards, todayScheduleQuery.data?.date]);

  const refetch = async () => todayScheduleQuery.refetch();

  return {
    adherenceRate,
    adherenceSummaryText,
    scheduleRemainingCount,
    scheduleCards,
    recentPrescriptions,
    healthTipTitle: "건강 팁",
    healthTipDescription:
      "약은 충분한 물과 함께 복용하세요. 최소 200ml(컵 1잔) 이상의 물과 함께 드시면 효과가 더 좋아요.",
    isLoading: todayScheduleQuery.isLoading,
    isError: todayScheduleQuery.isError,
    refetch,
  };
}
