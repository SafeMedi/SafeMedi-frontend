import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { parseApiError } from "@/api/error";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { CreatePrescriptionRequest } from "@/api/types";
import { parsePrescriptionFromJson } from "./ocr-parser";
import type { PrescriptionScanViewModel, ScanPrescriptionDraft } from "./types";

const DEFAULT_MANUAL_JSON = `{
  "title": "처방전 직접 입력",
  "startDate": "2026-05-13",
  "endDate": "2026-05-20",
  "takeTimes": ["09:00", "21:00"],
  "medications": [
    { "atcCode": "UNKNOWN", "drugName": "약물명 입력" }
  ],
  "rawText": "manual"
}`;
const OCR_REFACTOR_IN_PROGRESS_MESSAGE =
  "OCR 기능은 Google Vision API로 개편 중입니다. 현재는 직접 입력으로 처방전을 등록해 주세요.";

function toCreatePrescriptionBody(draft: ScanPrescriptionDraft): CreatePrescriptionRequest {
  return {
    title: draft.title,
    startDate: draft.startDate,
    endDate: draft.endDate,
    takeTimes: draft.takeTimes,
    medications: draft.medications,
  };
}

export function usePrescriptionScanViewModel(): PrescriptionScanViewModel {
  const [draft, setDraft] = useState<ScanPrescriptionDraft | null>(null);
  const [draftJson, setDraftJson] = useState<string>(DEFAULT_MANUAL_JSON);
  const [error, setError] = useState<Error | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isManualInputVisible, setIsManualInputVisible] = useState<boolean>(false);
  const createMutation = useCreatePrescriptionByScanMutation();

  const openManualInputForTemporaryOcrFallback = useCallback(() => {
    setError(null);
    setSelectedImageUri(null);
    setIsManualInputVisible(true);
    Alert.alert("OCR 일시 비활성화", OCR_REFACTOR_IN_PROGRESS_MESSAGE);
  }, []);

  const extractFromGallery = useCallback(async () => {
    openManualInputForTemporaryOcrFallback();
  }, [openManualInputForTemporaryOcrFallback]);

  const extractFromCamera = useCallback(async () => {
    openManualInputForTemporaryOcrFallback();
  }, [openManualInputForTemporaryOcrFallback]);

  const submitDraft = useCallback(async () => {
    if (!draft) {
      setError(new Error("등록할 스캔 결과가 없습니다. 먼저 스캔해 주세요."));
      return;
    }
    setError(null);
    try {
      const response = await createMutation.mutateAsync(toCreatePrescriptionBody(draft));
      if (response.hasAllergyConflict) {
        const warningMessages = response.allergyWarnings
          .map((item) => item.warningMessage)
          .join("\n");
        Alert.alert("처방전 등록 완료", `${response.message}\n${warningMessages}`);
      } else {
        Alert.alert("처방전 등록 완료", response.message);
      }
    } catch (submitError) {
      const parsedError = await parseApiError(submitError);
      setError(new Error(parsedError.message));
    }
  }, [createMutation, draft]);

  const retryExtract = useCallback(async () => {
    openManualInputForTemporaryOcrFallback();
  }, [openManualInputForTemporaryOcrFallback]);

  const applyManualJson = useCallback(() => {
    try {
      const manualDraft = parsePrescriptionFromJson(draftJson);
      setDraft(manualDraft);
      setError(null);
      setIsManualInputVisible(false);
    } catch (jsonError) {
      const normalizedError =
        jsonError instanceof Error
          ? jsonError
          : new Error("직접 입력 JSON 형식이 올바르지 않습니다.");
      setError(normalizedError);
    }
  }, [draftJson]);

  const openManualInput = useCallback(() => {
    setIsManualInputVisible(true);
  }, []);

  const closeManualInput = useCallback(() => {
    setIsManualInputVisible(false);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo<PrescriptionScanViewModel>(
    () => ({
      draft,
      draftJson,
      isExtracting: false,
      isSubmitting: createMutation.isPending,
      isManualInputVisible,
      error,
      selectedImageUri,
      extractFromGallery,
      extractFromCamera,
      submitDraft,
      retryExtract,
      openManualInput,
      closeManualInput,
      updateManualJson: setDraftJson,
      applyManualJson,
      resetError,
    }),
    [
      applyManualJson,
      closeManualInput,
      createMutation.isPending,
      draft,
      draftJson,
      error,
      extractFromCamera,
      extractFromGallery,
      isManualInputVisible,
      openManualInput,
      resetError,
      retryExtract,
      selectedImageUri,
      submitDraft,
    ],
  );
}
