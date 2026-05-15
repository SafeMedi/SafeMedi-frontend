import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { parseApiError } from "@/api/error";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { CreatePrescriptionRequest } from "@/api/types";
import { extractDraftFromImageSource, extractDraftFromImageUri } from "./device-ocr";
import { parsePrescriptionFromJson } from "./ocr-parser";
import type { PrescriptionScanViewModel, ScanPrescriptionDraft } from "./types";
import { usePrescriptionOcrResultStore } from "./usePrescriptionOcrResultStore";

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
const JSON_PRETTY_SPACE = 2;
const NO_SELECTED_IMAGE_ERROR = "재시도할 이미지가 없습니다. 먼저 사진을 선택해 주세요.";
const UNKNOWN_OCR_ERROR = "OCR 추출 중 알 수 없는 오류가 발생했습니다.";

type OcrImageSource = "camera" | "gallery";

function normalizeUnknownError(error: unknown): Error {
  return error instanceof Error ? error : new Error(UNKNOWN_OCR_ERROR);
}

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
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isManualInputVisible, setIsManualInputVisible] = useState<boolean>(false);
  const setOcrResult = usePrescriptionOcrResultStore((state) => state.setResult);
  const createMutation = useCreatePrescriptionByScanMutation();

  const applyExtractedDraft = useCallback((nextDraft: ScanPrescriptionDraft, imageUri: string) => {
    setDraft(nextDraft);
    setDraftJson(JSON.stringify(nextDraft, null, JSON_PRETTY_SPACE));
    setSelectedImageUri(imageUri);
    setIsManualInputVisible(false);
    setError(null);
  }, []);

  const navigateToResultScreen = useCallback(
    (nextDraft: ScanPrescriptionDraft, imageUri: string) => {
      setOcrResult({ draft: nextDraft, imageUri });
      router.push("/(detail)/scan-result");
    },
    [setOcrResult],
  );

  const runExtractFromSource = useCallback(
    async (source: OcrImageSource) => {
      setIsExtracting(true);
      setError(null);
      try {
        const result = await extractDraftFromImageSource(source);
        if (!result) {
          return;
        }
        applyExtractedDraft(result.draft, result.imageUri);
        navigateToResultScreen(result.draft, result.imageUri);
      } catch (extractError) {
        setError(normalizeUnknownError(extractError));
      } finally {
        setIsExtracting(false);
      }
    },
    [applyExtractedDraft, navigateToResultScreen],
  );

  const extractFromGallery = useCallback(async () => {
    await runExtractFromSource("gallery");
  }, [runExtractFromSource]);

  const extractFromCamera = useCallback(async () => {
    await runExtractFromSource("camera");
  }, [runExtractFromSource]);

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
    if (!selectedImageUri) {
      setError(new Error(NO_SELECTED_IMAGE_ERROR));
      return;
    }
    setIsExtracting(true);
    setError(null);
    try {
      const nextDraft = await extractDraftFromImageUri(selectedImageUri);
      applyExtractedDraft(nextDraft, selectedImageUri);
      navigateToResultScreen(nextDraft, selectedImageUri);
    } catch (extractError) {
      setError(normalizeUnknownError(extractError));
    } finally {
      setIsExtracting(false);
    }
  }, [applyExtractedDraft, navigateToResultScreen, selectedImageUri]);

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
      isExtracting,
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
      isExtracting,
      isManualInputVisible,
      openManualInput,
      resetError,
      retryExtract,
      selectedImageUri,
      submitDraft,
    ],
  );
}
