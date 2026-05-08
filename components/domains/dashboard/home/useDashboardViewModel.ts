import { useMemo } from "react";

import {
  useDashboardDailyMedicationRecords,
  useDashboardMonthlyMedicationRecords,
} from "@/api/queries/dashboard";
import type { DailyMedicationRecordItem } from "@/api/types";

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

function formatDateToApiParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateText: string): string {
  const parsedDate = new Date(dateText);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateText;
  }
  return parsedDate.toLocaleDateString("ko-KR", LOCALE_DATE_FORMAT_OPTIONS).replace(/\.$/, "");
}

function resolveScheduleTone(status: DailyMedicationRecordItem["status"]): DashboardScheduleTone {
  if (status === "SUCCESS") return "success";
  if (status === "DUE" || status === "OVERDUE") return "required";
  return "upcoming";
}

function resolveStatusLabel(status: DailyMedicationRecordItem["status"]): string {
  if (status === "SUCCESS") return "완료";
  if (status === "DUE" || status === "OVERDUE") return "복용 필요";
  return "대기중";
}

export function useDashboardViewModel(): DashboardViewModel {
  const today = useMemo(() => formatDateToApiParam(new Date()), []);

  const dailyQuery = useDashboardDailyMedicationRecords({ date: today });
  const monthlyQuery = useDashboardMonthlyMedicationRecords({ date: today });

  const adherenceRate = dailyQuery.data?.summary.totalCount
    ? Math.round((dailyQuery.data.summary.takenCount / dailyQuery.data.summary.totalCount) * 100)
    : 0;
  const adherenceSummaryText = dailyQuery.data?.summary.fraction ?? "0 / 0 완료";

  const scheduleCards = useMemo<readonly DashboardScheduleCardItem[]>(() => {
    if (!dailyQuery.data) return [];
    return dailyQuery.data.records.map((record) => ({
      id: String(record.recordId),
      scheduledTime: record.scheduledTime,
      prescriptionCount: 1,
      prescriptionTitle: record.prescriptionTitle,
      medicationCount: record.medicationNames.length,
      medicationNames: record.medicationNames,
      statusLabel: resolveStatusLabel(record.status),
      tone: resolveScheduleTone(record.status),
    }));
  }, [dailyQuery.data]);

  const scheduleRemainingCount = useMemo(() => {
    return scheduleCards.filter((card) => card.tone !== "success").length;
  }, [scheduleCards]);

  const recentPrescriptions = useMemo<readonly DashboardRecentPrescriptionItem[]>(() => {
    if (!monthlyQuery.data) return [];

    return monthlyQuery.data.records.slice(0, 3).map((group) => {
      const medicationSet = new Set<string>();
      group.items.forEach((item) => {
        item.medicationNames.forEach((name) => {
          medicationSet.add(name);
        });
      });

      return {
        id: group.date,
        dateLabel: formatDateLabel(group.date),
        analysisCount: medicationSet.size,
        hasWarning: group.items.some((item) => item.status !== "SUCCESS"),
      };
    });
  }, [monthlyQuery.data]);

  const refetch = async () => Promise.all([dailyQuery.refetch(), monthlyQuery.refetch()]);

  return {
    adherenceRate,
    adherenceSummaryText,
    scheduleRemainingCount,
    scheduleCards,
    recentPrescriptions,
    healthTipTitle: "건강 팁",
    healthTipDescription:
      "약은 충분한 물과 함께 복용하세요. 최소 200ml(컵 1잔) 이상의 물과 함께 드시면 효과가 더 좋아요.",
    isLoading: dailyQuery.isLoading || monthlyQuery.isLoading,
    isError: dailyQuery.isError || monthlyQuery.isError,
    refetch,
  };
}
