import { useMemo } from "react";
import { useDashboardMedicationHistoryRecords } from "@/api/queries/dashboard";
import type { MonthlyMedicationRecordItem } from "@/api/types";
import type {
  MedicationHistoryMedicationItem,
  MedicationHistoryViewModel,
  MedicationHistoryWarningItem,
} from "./types";

const EMPTY_DATE_LABEL = "-";
const DATE_FORMAT_OPTIONS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
} as const;

function normalizeDateParam(rawDate: string | undefined): string {
  if (!rawDate) return "";
  return rawDate.trim();
}

function formatDateLabel(dateText: string): string {
  const parsedDate = new Date(dateText);
  if (Number.isNaN(parsedDate.getTime())) return EMPTY_DATE_LABEL;
  return parsedDate.toLocaleDateString("ko-KR", DATE_FORMAT_OPTIONS).replace(/\.$/, "");
}

function extractActiveIngredients(medicationNames: readonly string[]): readonly string[] {
  return [...new Set(medicationNames)];
}

function createDefaultWarningItems(
  record: MonthlyMedicationRecordItem,
): readonly MedicationHistoryWarningItem[] {
  if (record.warningMessages && record.warningMessages.length > 0) {
    return record.warningMessages.map((message, index) => ({
      id: `${record.recordId}-warning-${index}`,
      message,
    }));
  }
  if (record.status !== "OVERDUE" && record.status !== "DUE") return [];
  return [
    {
      id: `${record.recordId}-status-warning`,
      message: "복용 필요 상태입니다. 복용 전 의사 상담이 필요할 수 있습니다.",
    },
  ];
}

function createMedicationItem(
  record: MonthlyMedicationRecordItem,
): MedicationHistoryMedicationItem {
  const scheduledTimesLabel = `${record.scheduledTime} 복용`;
  const tone = record.status === "OVERDUE" || record.status === "DUE" ? "warning" : "safe";

  return {
    id: String(record.recordId),
    medicationName: record.medicationNames[0] ?? record.prescriptionTitle,
    scheduledTimesLabel,
    activeIngredients: extractActiveIngredients(record.medicationNames),
    tone,
    warningItems: createDefaultWarningItems(record),
  };
}

export function useMedicationHistoryViewModel(
  dateParam: string | undefined,
): MedicationHistoryViewModel {
  const date = normalizeDateParam(dateParam);
  const query = useDashboardMedicationHistoryRecords({ date });

  const medications = useMemo<readonly MedicationHistoryMedicationItem[]>(() => {
    if (!query.data) return [];
    return query.data.items.map((record) => createMedicationItem(record));
  }, [query.data]);

  const warningCount = useMemo<number>(() => {
    return medications.filter((medication) => medication.tone === "warning").length;
  }, [medications]);

  const warningSummary =
    warningCount > 0 ? "일부 약물에 경고 사항이 있습니다. 의사와 상담 후 복용하세요." : null;
  const displayDate = date ? formatDateLabel(date) : EMPTY_DATE_LABEL;

  return {
    displayDate,
    warningSummary,
    medications,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
