import { useCallback, useMemo, useState } from "react";

import { useMedicationDailyRecords, useMedicationStatistics } from "@/api/queries/medications";
import type { MedicationRecordItem, MedicationRecordStatus } from "@/api/types/medications";
import {
  buildComplianceByDate,
  buildMedicationReportPeriodSummary,
  getMedicationReportMonthRange,
  type MedicationReportPeriodSummary,
  resolveSelectedDaySummary,
} from "../medication-statistics/medicationReportStatistics";

export type MedicationCalendarDayTone = "empty" | "future" | "green" | "yellow" | "red";

export interface MedicationCalendarDay {
  readonly id: string;
  readonly date: string | null;
  readonly day: number | null;
  readonly fraction: string | null;
  readonly rate: number | null;
  readonly tone: MedicationCalendarDayTone;
}

export interface MedicationCalendarRecordItem {
  readonly id: string;
  readonly medicationName: string;
  readonly scheduledTime: string;
  readonly status: MedicationRecordStatus;
  readonly statusLabel: string;
  readonly statusTone: "taken" | "missed";
  readonly isTaken: boolean;
}

export interface MedicationCalendarPrescriptionGroup {
  readonly id: string;
  readonly prescriptionTitle: string;
  readonly items: readonly MedicationCalendarRecordItem[];
}

export interface MedicationCalendarViewModel {
  readonly monthLabel: string;
  readonly periodSummary: MedicationReportPeriodSummary;
  readonly calendarWeeks: readonly (readonly MedicationCalendarDay[])[];
  readonly selectedDate: string | null;
  readonly setSelectedDate: (date: string) => void;
  readonly selectedDateTitle: string;
  readonly selectedDaySummary: string;
  readonly prescriptionGroups: readonly MedicationCalendarPrescriptionGroup[];
  readonly isInitialLoading: boolean;
  readonly isDailyRecordsLoading: boolean;
  readonly isError: boolean;
  readonly isDailyRecordsError: boolean;
  readonly refetch: () => Promise<unknown>;
  readonly refetchDailyRecords: () => Promise<unknown>;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

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

function resolveDayTone(rate: number | null): MedicationCalendarDayTone {
  if (rate === null) return "empty";
  if (rate >= 90) return "green";
  if (rate >= 70) return "yellow";
  return "red";
}

function resolveDayRate(entry: {
  readonly takenCount: number;
  readonly totalCount: number;
}): number {
  if (entry.totalCount === 0) return 0;
  return clampRate((entry.takenCount / entry.totalCount) * 100);
}

function isMedicationTaken(status: MedicationRecordStatus): boolean {
  return status === "SUCCESS";
}

function resolveStatusLabel(status: MedicationRecordStatus): string {
  if (status === "SUCCESS") return "완료";
  return "복용 필요";
}

function resolveStatusTone(
  status: MedicationRecordStatus,
): MedicationCalendarRecordItem["statusTone"] {
  if (status === "SUCCESS") return "taken";
  return "missed";
}

function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function formatSelectedDateTitle(dateText: string): string {
  return `${dateText} 복약 기록`;
}

function buildRecordItem(record: MedicationRecordItem): MedicationCalendarRecordItem {
  return {
    id: String(record.recordId),
    medicationName: record.medicationNames[0] ?? record.prescriptionTitle,
    scheduledTime: record.scheduledTime,
    status: record.status,
    statusLabel: resolveStatusLabel(record.status),
    statusTone: resolveStatusTone(record.status),
    isTaken: isMedicationTaken(record.status),
  };
}

export function groupMedicationRecordsByPrescription(
  items: readonly MedicationRecordItem[],
): readonly MedicationCalendarPrescriptionGroup[] {
  const groups = new Map<string, MedicationCalendarPrescriptionGroup>();

  items.forEach((item) => {
    const existingGroup = groups.get(item.prescriptionTitle);
    const nextItem = buildRecordItem(item);

    if (existingGroup) {
      groups.set(item.prescriptionTitle, {
        ...existingGroup,
        items: [...existingGroup.items, nextItem],
      });
      return;
    }

    groups.set(item.prescriptionTitle, {
      id: item.prescriptionTitle,
      prescriptionTitle: item.prescriptionTitle,
      items: [nextItem],
    });
  });

  return Array.from(groups.values());
}

export function buildMedicationCalendarWeeks(params: {
  readonly monthDate: Date;
  readonly today: Date;
  readonly complianceByDate: ReadonlyMap<
    string,
    {
      readonly date: string;
      readonly takenCount: number;
      readonly totalCount: number;
      readonly fraction: string;
    }
  >;
}): readonly (readonly MedicationCalendarDay[])[] {
  const { monthDate, today, complianceByDate } = params;
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const todayText = formatDateToApiParam(today);

  const cells: MedicationCalendarDay[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({
      id: `pad-start-${index}`,
      date: null,
      day: null,
      fraction: null,
      rate: null,
      tone: "empty",
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateText = formatDateToApiParam(new Date(year, month, day));
    const entry = complianceByDate.get(dateText);
    const isFutureDate = dateText > todayText;

    if (isFutureDate) {
      cells.push({
        id: dateText,
        date: dateText,
        day,
        fraction: null,
        rate: null,
        tone: "future",
      });
      continue;
    }

    if (!entry || entry.totalCount === 0) {
      cells.push({
        id: dateText,
        date: dateText,
        day,
        fraction: null,
        rate: null,
        tone: "empty",
      });
      continue;
    }

    const rate = resolveDayRate(entry);
    cells.push({
      id: dateText,
      date: dateText,
      day,
      fraction: entry.fraction,
      rate,
      tone: resolveDayTone(rate),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      id: `pad-end-${cells.length}`,
      date: null,
      day: null,
      fraction: null,
      rate: null,
      tone: "empty",
    });
  }

  const weeks: MedicationCalendarDay[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export function resolveDefaultSelectedDate(
  complianceByDate: ReadonlyMap<
    string,
    {
      readonly date: string;
    }
  >,
  today: Date,
): string | null {
  const todayText = formatDateToApiParam(today);
  if (complianceByDate.has(todayText)) {
    return todayText;
  }

  const sortedDates = [...complianceByDate.keys()].sort();
  return sortedDates[sortedDates.length - 1] ?? todayText;
}

export function getMedicationCalendarWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

export function useMedicationCalendarViewModel(today = new Date()): MedicationCalendarViewModel {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const monthRange = useMemo(() => getMedicationReportMonthRange(today), [today]);

  const monthlyStatisticsQuery = useMedicationStatistics({
    startDate: monthRange.startDate,
    endDate: monthRange.endDate,
  });

  const complianceByDate = useMemo(
    () => buildComplianceByDate(monthlyStatisticsQuery.data?.dailyCompliance ?? []),
    [monthlyStatisticsQuery.data?.dailyCompliance],
  );

  const resolvedSelectedDate = useMemo(() => {
    if (selectedDate) {
      return selectedDate;
    }
    return resolveDefaultSelectedDate(complianceByDate, today);
  }, [complianceByDate, selectedDate, today]);

  const dailyRecordsQuery = useMedicationDailyRecords({
    date: resolvedSelectedDate ?? monthRange.startDate,
    enabled: !!resolvedSelectedDate,
  });

  const calendarWeeks = useMemo(
    () =>
      buildMedicationCalendarWeeks({
        monthDate: today,
        today,
        complianceByDate,
      }),
    [complianceByDate, today],
  );

  const selectedCompliance = resolvedSelectedDate
    ? complianceByDate.get(resolvedSelectedDate)
    : undefined;

  const prescriptionGroups = useMemo(
    () => groupMedicationRecordsByPrescription(dailyRecordsQuery.data?.records ?? []),
    [dailyRecordsQuery.data?.records],
  );

  const periodSummary = useMemo(
    () => buildMedicationReportPeriodSummary(monthlyStatisticsQuery.data, today),
    [monthlyStatisticsQuery.data, today],
  );

  const handleSetSelectedDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const selectedDaySummary = useMemo(() => {
    if (dailyRecordsQuery.data) {
      const summary = dailyRecordsQuery.data.summary;
      const rate = clampRate(summary.complianceRate);
      return `${summary.fraction} 완료 (${rate}%)`;
    }

    return resolveSelectedDaySummary(selectedCompliance);
  }, [dailyRecordsQuery.data, selectedCompliance]);

  return {
    monthLabel: formatMonthLabel(today),
    periodSummary,
    calendarWeeks,
    selectedDate: resolvedSelectedDate,
    setSelectedDate: handleSetSelectedDate,
    selectedDateTitle: resolvedSelectedDate
      ? formatSelectedDateTitle(resolvedSelectedDate)
      : "복약 기록",
    selectedDaySummary,
    prescriptionGroups,
    isInitialLoading: monthlyStatisticsQuery.isLoading && !monthlyStatisticsQuery.data,
    isDailyRecordsLoading:
      dailyRecordsQuery.isFetching && !dailyRecordsQuery.data && !!resolvedSelectedDate,
    isError: monthlyStatisticsQuery.isError,
    isDailyRecordsError: dailyRecordsQuery.isError,
    refetch: async () => {
      await Promise.all([monthlyStatisticsQuery.refetch(), dailyRecordsQuery.refetch()]);
    },
    refetchDailyRecords: async () => {
      await dailyRecordsQuery.refetch();
    },
  };
}
