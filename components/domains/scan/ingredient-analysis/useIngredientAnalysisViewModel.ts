import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { parseApiError } from "@/api/error";
import { useAnalyzeIngredientsMutation } from "@/api/queries/ingredient-analysis";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { AnalyzeIngredientsResponse } from "@/api/types";
import { usePrescriptionOcrResultStore } from "../prescription-scan/usePrescriptionOcrResultStore";
import type { IngredientAnalysisViewModel } from "./types";
import { useIngredientAnalysisStore } from "./useIngredientAnalysisStore";

const EMPTY_REQUEST_ERROR = "분석할 약물 정보가 없습니다. 스캔 결과 화면으로 이동합니다.";

export function useIngredientAnalysisViewModel(): IngredientAnalysisViewModel {
  const request = useIngredientAnalysisStore((state) => state.request);
  const clearRequest = useIngredientAnalysisStore((state) => state.clearRequest);
  const clearOcrResult = usePrescriptionOcrResultStore((state) => state.clearResult);
  const analyzeMutation = useAnalyzeIngredientsMutation();
  const createMutation = useCreatePrescriptionByScanMutation();
  const shouldIgnoreMissingRequestAlertRef = useRef<boolean>(false);
  const [result, setResult] = useState<AnalyzeIngredientsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!request && !shouldIgnoreMissingRequestAlertRef.current) {
      Alert.alert("성분 분석 정보 없음", EMPTY_REQUEST_ERROR, [
        { text: "확인", onPress: () => router.replace("/(detail)/scan/scan-result") },
      ]);
    }
  }, [request]);

  useEffect(() => {
    if (!request || result || analyzeMutation.isPending) {
      return;
    }

    let isActive = true;
    analyzeMutation
      .mutateAsync(request)
      .then((response) => {
        if (!isActive) {
          return;
        }
        setResult(response);
        setErrorMessage(null);
      })
      .catch(async (error) => {
        if (!isActive) {
          return;
        }
        const parsedError = await parseApiError(error);
        setErrorMessage(parsedError.message);
      });

    return () => {
      isActive = false;
    };
  }, [analyzeMutation, request, result]);

  const handlePressClose = useCallback(() => {
    shouldIgnoreMissingRequestAlertRef.current = true;
    clearRequest();
    router.replace("/(tabs)/dashboard");
  }, [clearRequest]);

  const handlePressCancel = useCallback(() => {
    router.back();
  }, []);

  const handlePressConfirm = useCallback(async () => {
    if (!request) {
      return;
    }

    try {
      const response = await createMutation.mutateAsync(request);
      const warningMessages = response.allergyWarnings
        .map((item) => item.warningMessage)
        .join("\n");
      const feedbackMessage = response.hasAllergyConflict
        ? `${response.message}\n${warningMessages}`
        : response.message;

      Alert.alert(
        response.hasAllergyConflict ? "알레르기 주의" : "복약 등록 완료",
        feedbackMessage,
        [
          {
            text: "확인",
            onPress: () => {
              shouldIgnoreMissingRequestAlertRef.current = true;
              clearRequest();
              clearOcrResult();
              router.replace("/(tabs)/dashboard");
            },
          },
        ],
      );
    } catch (error) {
      const parsedError = await parseApiError(error);
      Alert.alert("복약 등록 실패", parsedError.message);
    }
  }, [clearOcrResult, clearRequest, createMutation, request]);

  return useMemo(
    () => ({
      request,
      result,
      isAnalyzing: analyzeMutation.isPending,
      isSubmitting: createMutation.isPending,
      errorMessage,
      handlePressClose,
      handlePressCancel,
      handlePressConfirm,
    }),
    [
      analyzeMutation.isPending,
      createMutation.isPending,
      errorMessage,
      handlePressCancel,
      handlePressClose,
      handlePressConfirm,
      request,
      result,
    ],
  );
}
