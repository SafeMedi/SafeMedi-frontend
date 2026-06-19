import { useCallback, useMemo, useState } from "react";

import { useDashboardMonthlyMedicationRecords } from "@/api/queries/dashboard";
import type {
  MedicationRecordStatus,
  MonthlyMedicationRecordGroup,
  MonthlyMedicationRecordItem,
} from "@/api/types/dashboard";

export type MedicationReportTab = "calendar" | "statistics" | "management";

export type MedicationReportDayTone = "empty" | "future" | "green" | "yellow" | "red";

export interface MedicationReportCalendarDay {
  readonly id: string;
  readonly date: string | null;
  readonly day: number | null;
  readonly fraction: string | null;
  readonly rate: number | null;
  readonly tone: MedicationReportDayTone;
}

export interface MedicationReportRecordItem {
  readonly id: string;
  readonly medicationName: string;
  readonly scheduledTime: string;
  readonly status: MedicationRecordStatus;
  readonly statusLabel: string;
  readonly isTaken: boolean;
}

export interface MedicationReportPrescriptionGroup {
  readonly id: string;
  readonly prescriptionTitle: string;
  readonly items: readonly MedicationReportRecordItem[];
}

export interface MedicationReportViewModel {
  readonly activeTab: MedicationReportTab;
  readonly setActiveTab: (tab: MedicationReportTab) => void;
  readonly monthLabel: string;
  readonly periodRangeLabel: string;
  readonly complianceRate: number;
  readonly perfectDaysCount: number;
  readonly attentionDaysCount: number;
  readonly calendarWeeks: readonly (readonly MedicationReportCalendarDay[])[];
  readonly selectedDate: string | null;
  readonly setSelectedDate: (date: string) => void;
  readonly selectedDateTitle: string;
  readonly selectedDaySummary: string;
  readonly prescriptionGroups: readonly MedicationReportPrescriptionGroup[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => Promise<unknown>;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function formatDateToApiParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseApiDate(dateText: string): Date | null {
  const parsedDate = new Date(`${dateText}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 0;
  return Math.max(0, Math.min(100, Math.round(rate)));
}

function resolveDayTone(rate: number | null): MedicationReportDayTone {
  if (rate === null) return "empty";
  if (rate >= 90) return "green";
  if (rate >= 70) return "yellow";
  return "red";
}

function isMedicationTaken(status: MedicationRecordStatus): boolean {
  return status === "SUCCESS";
}

function resolveStatusLabel(status: MedicationRecordStatus): string {
  if (status === "SUCCESS") return "완료";
  return "미복용";
}

function computeDayCompliance(items: readonly MonthlyMedicationRecordItem[]): {
  readonly takenCount: number;
  readonly totalCount: number;
  readonly fraction: string;
  readonly rate: number;
} {
  const totalCount = items.length;
  const takenCount = items.filter((item) => isMedicationTaken(item.status)).length;
  const rate = totalCount > 0 ? clampRate((takenCount / totalCount) * 100) : 0;

  return {
    takenCount,
    totalCount,
    fraction: `${takenCount}/${totalCount}`,
    rate,
  };
}

function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function formatKoreanMonthDay(dateText: string): string {
  const parsedDate = parseApiDate(dateText);
  if (!parsedDate) return dateText;
  return `${parsedDate.getMonth() + 1}월 ${parsedDate.getDate()}일`;
}

function formatSelectedDateTitle(dateText: string): string {
  return `${dateText} 복약 기록`;
}

function formatSelectedDaySummary(takenCount: number, totalCount: number, rate: number): string {
  return `${takenCount}/${totalCount} 완료 (${rate}%)`;
}

function buildRecordItem(record: MonthlyMedicationRecordItem): MedicationReportRecordItem {
  return {
    id: String(record.recordId),
    medicationName: record.medicationNames[0] ?? record.prescriptionTitle,
    scheduledTime: record.scheduledTime,
    status: record.status,
    statusLabel: resolveStatusLabel(record.status),
    isTaken: isMedicationTaken(record.status),
  };
}

function groupPrescriptions(
  items: readonly MonthlyMedicationRecordItem[],
): readonly MedicationReportPrescriptionGroup[] {
  const groups = new Map<string, MedicationReportPrescriptionGroup>();

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

function buildPeriodRangeLabel(
  recordDates: readonly string[],
  monthDate: Date,
  today: Date,
): string {
  if (recordDates.length === 0) {
    return `${monthDate.getMonth() + 1}월 1일`;
  }

  const sortedDates = [...recordDates].sort();
  const monthStart = formatDateToApiParam(
    new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
  );
  const isCurrentMonth =
    monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth();
  const endDate = isCurrentMonth
    ? formatDateToApiParam(today)
    : (sortedDates[sortedDates.length - 1] ?? monthStart);

  const startDate = sortedDates[0] ?? monthStart;
  return `${formatKoreanMonthDay(startDate)} ~ ${formatKoreanMonthDay(endDate)}`;
}

export function buildMedicationReportCalendarWeeks(params: {
  readonly monthDate: Date;
  readonly today: Date;
  readonly recordsByDate: ReadonlyMap<string, MonthlyMedicationRecordGroup>;
}): readonly (readonly MedicationReportCalendarDay[])[] {
  const { monthDate, today, recordsByDate } = params;
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const todayText = formatDateToApiParam(today);

  const cells: MedicationReportCalendarDay[] = [];

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
    const recordGroup = recordsByDate.get(dateText);

    if (!recordGroup) {
      const tone: MedicationReportDayTone = dateText > todayText ? "future" : "empty";
      cells.push({
        id: dateText,
        date: dateText,
        day,
        fraction: null,
        rate: null,
        tone,
      });
      continue;
    }

    const compliance = computeDayCompliance(recordGroup.items);
    cells.push({
      id: dateText,
      date: dateText,
      day,
      fraction: compliance.fraction,
      rate: compliance.rate,
      tone: resolveDayTone(compliance.rate),
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

  const weeks: MedicationReportCalendarDay[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export function countMedicationReportDayBuckets(records: readonly MonthlyMedicationRecordGroup[]): {
  readonly perfectDaysCount: number;
  readonly attentionDaysCount: number;
} {
  let perfectDaysCount = 0;
  let attentionDaysCount = 0;

  records.forEach((group) => {
    const { rate } = computeDayCompliance(group.items);
    if (rate >= 90) {
      perfectDaysCount += 1;
      return;
    }
    if (group.items.length > 0) {
      attentionDaysCount += 1;
    }
  });

  return { perfectDaysCount, attentionDaysCount };
}

export function resolveDefaultSelectedDate(
  records: readonly MonthlyMedicationRecordGroup[],
  today: Date,
): string | null {
  const todayText = formatDateToApiParam(today);
  if (records.some((group) => group.date === todayText)) {
    return todayText;
  }

  const sortedDates = [...records].map((group) => group.date).sort();
  return sortedDates[sortedDates.length - 1] ?? null;
}

export function getMedicationReportWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

export function useMedicationReportViewModel(today = new Date()): MedicationReportViewModel {
  const [activeTab, setActiveTab] = useState<MedicationReportTab>("calendar");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthQueryDate = formatDateToApiParam(today);
  const monthlyQuery = useDashboardMonthlyMedicationRecords({ date: monthQueryDate });

  const recordsByDate = useMemo(() => {
    const map = new Map<string, MonthlyMedicationRecordGroup>();
    monthlyQuery.data?.records.forEach((group) => {
      map.set(group.date, group);
    });
    return map;
  }, [monthlyQuery.data?.records]);

  const calendarWeeks = useMemo(
    () =>
      buildMedicationReportCalendarWeeks({
        monthDate: today,
        today,
        recordsByDate,
      }),
    [recordsByDate, today],
  );

  const resolvedSelectedDate = useMemo(() => {
    if (selectedDate && recordsByDate.has(selectedDate)) {
      return selectedDate;
    }
    return resolveDefaultSelectedDate(monthlyQuery.data?.records ?? [], today);
  }, [monthlyQuery.data?.records, recordsByDate, selectedDate, today]);

  const selectedGroup = resolvedSelectedDate ? recordsByDate.get(resolvedSelectedDate) : undefined;
  const selectedCompliance = selectedGroup
    ? computeDayCompliance(selectedGroup.items)
    : { takenCount: 0, totalCount: 0, fraction: "0/0", rate: 0 };

  const { perfectDaysCount, attentionDaysCount } = useMemo(
    () => countMedicationReportDayBuckets(monthlyQuery.data?.records ?? []),
    [monthlyQuery.data?.records],
  );

  const prescriptionGroups = useMemo(
    () => groupPrescriptions(selectedGroup?.items ?? []),
    [selectedGroup?.items],
  );

  const handleSetSelectedDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  return {
    activeTab,
    setActiveTab,
    monthLabel: formatMonthLabel(today),
    periodRangeLabel: buildPeriodRangeLabel(
      monthlyQuery.data?.records.map((group) => group.date) ?? [],
      today,
      today,
    ),
    complianceRate: clampRate(monthlyQuery.data?.summary.successRate ?? 0),
    perfectDaysCount,
    attentionDaysCount,
    calendarWeeks,
    selectedDate: resolvedSelectedDate,
    setSelectedDate: handleSetSelectedDate,
    selectedDateTitle: resolvedSelectedDate
      ? formatSelectedDateTitle(resolvedSelectedDate)
      : "복약 기록",
    selectedDaySummary: formatSelectedDaySummary(
      selectedCompliance.takenCount,
      selectedCompliance.totalCount,
      selectedCompliance.rate,
    ),
    prescriptionGroups,
    isLoading: monthlyQuery.isLoading,
    isError: monthlyQuery.isError,
    refetch: () => monthlyQuery.refetch(),
  };
}
