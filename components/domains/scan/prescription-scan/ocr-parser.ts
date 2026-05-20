import { z } from "zod";
import type { ScanMedicationItem, ScanPrescriptionDraft } from "./types";

const EMPTY_DRUG_FALLBACK = "미확인 약물";
const EMPTY_TITLE_FALLBACK = "처방전 스캔 등록";
const DEFAULT_ATC_CODE = "UNKNOWN";
const DATE_PATTERN = /\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b/g;

const medicationSchema = z.object({
  atcCode: z.string().min(1),
  drugName: z.string().min(1),
});

const draftSchema = z.object({
  title: z.string(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  medications: z.array(medicationSchema).min(1),
  rawText: z.string().min(1),
});

function normalizeDate(rawDate: string): string {
  const normalized = rawDate.replace(/[.]/g, "-").replace(/\//g, "-");
  const [year, month, day] = normalized.split("-");
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  return `${year}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
}

function extractDateRange(rawText: string): {
  readonly startDate: string;
  readonly endDate: string;
} {
  const matches = rawText.match(DATE_PATTERN) ?? [];
  const normalized = matches.map((value) => normalizeDate(value));
  const today = new Date().toISOString().slice(0, 10);
  if (normalized.length === 0) {
    return { startDate: today, endDate: today };
  }
  if (normalized.length === 1) {
    return { startDate: normalized[0], endDate: normalized[0] };
  }
  return { startDate: normalized[0], endDate: normalized[1] };
}

function normalizeMedicationName(line: string): string {
  return line.replace(/[-*•]/g, "").trim();
}

function extractMedications(rawText: string): readonly ScanMedicationItem[] {
  const lines = rawText
    .split(/\n+/)
    .map((line) => normalizeMedicationName(line))
    .filter((line) => line.length > 0);
  const medicationCandidates = lines.filter((line) => /정|캡슐|시럽|mg|ml|약/.test(line));
  if (medicationCandidates.length === 0) {
    return [{ atcCode: DEFAULT_ATC_CODE, drugName: EMPTY_DRUG_FALLBACK }];
  }
  return medicationCandidates.map((drugName) => ({ atcCode: DEFAULT_ATC_CODE, drugName }));
}

function extractTitle(rawText: string): string {
  const firstMeaningfulLine = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .find((line) => line.length > 2);
  return firstMeaningfulLine ?? EMPTY_TITLE_FALLBACK;
}

export function parsePrescriptionFromOcrText(rawText: string): ScanPrescriptionDraft {
  const trimmedText = rawText.trim();
  if (trimmedText.length === 0) {
    throw new Error("OCR 결과가 비어 있습니다. 이미지가 선명한지 확인해 주세요.");
  }
  const dateRange = extractDateRange(trimmedText);
  const candidate = {
    title: extractTitle(trimmedText),
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    medications: extractMedications(trimmedText),
    rawText: trimmedText,
  };
  return draftSchema.parse(candidate);
}

export function parsePrescriptionFromJson(jsonText: string): ScanPrescriptionDraft {
  const parsed = JSON.parse(jsonText) as unknown;
  return draftSchema.parse(parsed);
}
