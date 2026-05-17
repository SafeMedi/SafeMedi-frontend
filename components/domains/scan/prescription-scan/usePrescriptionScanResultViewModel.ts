import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Alert } from "react-native";
import { parseApiError } from "@/api/error";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { CreatePrescriptionMedication, CreatePrescriptionRequest } from "@/api/types";
import { usePrescriptionOcrResultStore } from "./usePrescriptionOcrResultStore";

interface EditableMedicationItem {
  readonly drugName: string;
  readonly atcCode: string;
}

interface PrescriptionScanResultFormValues {
  readonly title: string;
  readonly medications: EditableMedicationItem[];
}

const MANUAL_MEDICATION_NAME = "새 약물";
const MANUAL_MEDICATION_ATC = "UNKNOWN";
const MANUAL_INPUT_IMAGE_URI_PREFIX = "manual://";
const EMPTY_RESULT_ERROR = "복약 등록 정보가 없습니다. 스캔 화면으로 이동합니다.";

function createRequestMedications(
  medications: readonly EditableMedicationItem[],
): CreatePrescriptionMedication[] {
  return medications.map((item) => ({
    atcCode: item.atcCode.trim() || MANUAL_MEDICATION_ATC,
    drugName: item.drugName.trim(),
  }));
}

export function usePrescriptionScanResultViewModel() {
  const result = usePrescriptionOcrResultStore((state) => state.result);
  const clearResult = usePrescriptionOcrResultStore((state) => state.clearResult);
  const createMutation = useCreatePrescriptionByScanMutation();
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null);
  const shouldSuppressEmptyResultAlertRef = useRef<boolean>(false);

  const initialValues = useMemo<PrescriptionScanResultFormValues | null>(() => {
    if (!result) return null;
    return {
      title: result.draft.title,
      medications: result.draft.medications.map((item) => ({
        drugName: item.drugName,
        atcCode: item.atcCode,
      })),
    };
  }, [result]);

  const form = useForm<PrescriptionScanResultFormValues>({
    defaultValues: initialValues ?? { title: "", medications: [] },
  });
  const { control, getValues, reset, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications",
  });

  useEffect(() => {
    if (!initialValues) return;
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    if (result) return;
    if (shouldSuppressEmptyResultAlertRef.current) return;
    Alert.alert("스캔 결과 없음", EMPTY_RESULT_ERROR, [
      {
        text: "확인",
        onPress: () => router.replace("/(detail)/scan/scan"),
      },
    ]);
  }, [result]);

  const handlePressClose = useCallback(() => {
    router.replace("/(tabs)/dashboard");
  }, []);

  const handlePressRetryScan = useCallback(() => {
    shouldSuppressEmptyResultAlertRef.current = true;
    clearResult();
    router.replace("/(detail)/scan/scan");
  }, [clearResult]);

  const handlePressAddMedication = useCallback(() => {
    append({ drugName: MANUAL_MEDICATION_NAME, atcCode: MANUAL_MEDICATION_ATC });
    setEditingMedicationIndex(fields.length);
  }, [append, fields.length]);

  const handlePressRemoveMedication = useCallback(
    (index: number) => {
      remove(index);
      setEditingMedicationIndex((prev) => {
        if (prev === null) return null;
        if (prev === index) return null;
        return prev > index ? prev - 1 : prev;
      });
    },
    [remove],
  );

  const handlePressEditMedication = useCallback((index: number) => {
    setEditingMedicationIndex(index);
  }, []);

  const handleFinishEditMedication = useCallback(
    (index: number) => {
      const nextValue = getValues(`medications.${index}.drugName`).trim();
      if (!nextValue) {
        setValue(`medications.${index}.drugName`, MANUAL_MEDICATION_NAME, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
      setEditingMedicationIndex(null);
    },
    [getValues, setValue],
  );

  const handlePressAnalyze = useCallback(async () => {
    if (!result) return;

    const values = getValues();
    const title = values.title.trim();
    const medications = createRequestMedications(values.medications);

    if (!title) {
      Alert.alert("입력 확인", "처방전 제목을 입력해주세요.");
      return;
    }
    if (!medications.length) {
      Alert.alert("입력 확인", "최소 1개의 약물을 등록해주세요.");
      return;
    }
    if (medications.some((item) => item.drugName.length === 0)) {
      Alert.alert("입력 확인", "약물명을 모두 입력해주세요.");
      return;
    }

    const payload: CreatePrescriptionRequest = {
      title,
      startDate: result.draft.startDate,
      endDate: result.draft.endDate,
      takeTimes: result.draft.takeTimes,
      medications,
    };

    try {
      const response = await createMutation.mutateAsync(payload);
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
              shouldSuppressEmptyResultAlertRef.current = true;
              clearResult();
              router.replace("/(tabs)/dashboard");
            },
          },
        ],
      );
    } catch (error) {
      const parsedError = await parseApiError(error);
      Alert.alert("복약 등록 실패", parsedError.message);
    }
  }, [clearResult, createMutation, getValues, result]);

  const recognizedMedicationCount = result?.draft.medications.length ?? 0;
  const isManualInputMode = result?.imageUri.startsWith(MANUAL_INPUT_IMAGE_URI_PREFIX) ?? false;

  return {
    control,
    fields,
    editingMedicationIndex,
    isSubmitting: createMutation.isPending,
    recognizedMedicationCount,
    isManualInputMode,
    handlePressClose,
    handlePressRetryScan,
    handlePressAddMedication,
    handlePressAnalyze,
    handlePressEditMedication,
    handleFinishEditMedication,
    handlePressRemoveMedication,
  };
}
