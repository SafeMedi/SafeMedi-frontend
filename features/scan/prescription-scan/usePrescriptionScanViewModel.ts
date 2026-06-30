import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { parseApiError } from "@/api/error";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { CreatePrescriptionRequest } from "@/api/types";
import { extractDraftFromImageSource, extractDraftFromImageUri } from "./device-ocr";
import { parsePrescriptionFromJson } from "./ocr-parser";
import type {
  PrescriptionScanViewModel,
  PrescriptionSubmitFeedback,
  ScanPrescriptionDraft,
} from "./types";
import { usePrescriptionOcrResultStore } from "./usePrescriptionOcrResultStore";

const DEFAULT_MANUAL_DRAFT: ScanPrescriptionDraft = {
  title: "",
  startDate: "2026-05-13",
  endDate: "2026-05-20",
  medications: [],
  rawText: "manual",
};
const DEFAULT_MANUAL_JSON = JSON.stringify(DEFAULT_MANUAL_DRAFT, null, 2);
const MANUAL_INPUT_IMAGE_URI = "manual://input";
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
    isDoctorApproved: true,
    medications: draft.medications.map((medication) => ({
      drugCode: "",
      atcCode: medication.atcCode,
      drugName: medication.drugName,
    })),
  };
}

export function usePrescriptionScanViewModel(): PrescriptionScanViewModel {
  const [draft, setDraft] = useState<ScanPrescriptionDraft | null>(null);
  const [draftJson, setDraftJson] = useState<string>(DEFAULT_MANUAL_JSON);
  const [error, setError] = useState<Error | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<PrescriptionSubmitFeedback | null>(null);
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
      router.push("/(detail)/scan/scan-result");
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
    setSubmitFeedback(null);
    try {
      const response = await createMutation.mutateAsync(toCreatePrescriptionBody(draft));
      const allergyWarnings = response.allergyWarnings ?? [];
      const hasAllergyConflict = response.hasAllergyConflict ?? false;
      const warningMessages = allergyWarnings.map((item) => item.warningMessage).join("\n");
      const message = hasAllergyConflict
        ? `${response.message}\n${warningMessages}`
        : response.message;
      setSubmitFeedback({
        kind: hasAllergyConflict ? "warning" : "success",
        message,
      });
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
    applyExtractedDraft(DEFAULT_MANUAL_DRAFT, MANUAL_INPUT_IMAGE_URI);
    navigateToResultScreen(DEFAULT_MANUAL_DRAFT, MANUAL_INPUT_IMAGE_URI);
  }, [applyExtractedDraft, navigateToResultScreen]);

  const closeManualInput = useCallback(() => {
    setIsManualInputVisible(false);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const resetSubmitFeedback = useCallback(() => {
    setSubmitFeedback(null);
  }, []);

  return useMemo<PrescriptionScanViewModel>(
    () => ({
      draft,
      draftJson,
      isExtracting,
      isSubmitting: createMutation.isPending,
      isManualInputVisible,
      error,
      submitFeedback,
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
      resetSubmitFeedback,
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
      resetSubmitFeedback,
      retryExtract,
      selectedImageUri,
      submitFeedback,
      submitDraft,
    ],
  );
}
