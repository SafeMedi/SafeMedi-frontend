import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Alert } from "react-native";
import { parseApiError } from "@/api/error";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type {
  CreatePrescriptionMedication,
  CreatePrescriptionRequest,
  DrugSearchItem,
} from "@/api/types";
import { usePrescriptionOcrResultStore } from "./usePrescriptionOcrResultStore";

export type MedicationTakeSlot = "MORNING" | "LUNCH" | "DINNER";

interface MedicationTakeSlotOption {
  readonly slot: MedicationTakeSlot;
  readonly label: string;
  readonly timeRange: string;
  readonly defaultTime: string;
}

export const MEDICATION_TAKE_SLOT_OPTIONS: readonly MedicationTakeSlotOption[] = [
  { slot: "MORNING", label: "🌅 아침", timeRange: "07:00~09:00", defaultTime: "08:00" },
  { slot: "LUNCH", label: "☀ 점심", timeRange: "12:00~14:00", defaultTime: "13:00" },
  { slot: "DINNER", label: "🌙 저녁", timeRange: "18:00~20:00", defaultTime: "19:00" },
] as const;

const DEFAULT_SLOT_BY_HOUR: Record<MedicationTakeSlot, readonly [number, number]> = {
  MORNING: [7, 9],
  LUNCH: [12, 14],
  DINNER: [18, 20],
};

export interface EditableMedicationItem {
  readonly drugName: string;
  readonly atcCode: string;
  readonly dosage: string;
  readonly takeSlots: MedicationTakeSlot[];
}

export interface PrescriptionScanResultFormValues {
  readonly title: string;
  readonly medications: EditableMedicationItem[];
}

const EMPTY_MEDICATION_ATC_CODE = "";
const MANUAL_INPUT_IMAGE_URI_PREFIX = "manual://";
const EMPTY_RESULT_ERROR = "복약 등록 정보가 없습니다. 스캔 화면으로 이동합니다.";
const DRUG_NAME_NOT_SELECTED_ERROR = "약물명은 검색 결과에서 선택해야 합니다.";

function normalizeTakeTimesToSlots(takeTimes: readonly string[]): MedicationTakeSlot[] {
  const slots = takeTimes.reduce<MedicationTakeSlot[]>((acc, takeTime) => {
    const hour = Number(takeTime.split(":")[0]);
    if (Number.isNaN(hour)) {
      return acc;
    }

    MEDICATION_TAKE_SLOT_OPTIONS.forEach((option) => {
      const [startHour, endHour] = DEFAULT_SLOT_BY_HOUR[option.slot];
      if (hour >= startHour && hour <= endHour && !acc.includes(option.slot)) {
        acc.push(option.slot);
      }
    });
    return acc;
  }, []);

  if (slots.length > 0) {
    return slots;
  }
  return [];
}

function convertTakeSlotsToTimes(takeSlots: readonly MedicationTakeSlot[]): string[] {
  const selected = new Set(takeSlots);
  return MEDICATION_TAKE_SLOT_OPTIONS.filter((option) => selected.has(option.slot)).map(
    (option) => option.defaultTime,
  );
}

function createRequestMedications(
  medications: readonly EditableMedicationItem[],
): CreatePrescriptionMedication[] {
  return medications.map((item) => ({
    atcCode: item.atcCode.trim(),
    drugName: item.drugName.trim(),
    dosage: item.dosage.trim(),
    takeTimes: convertTakeSlotsToTimes(item.takeSlots),
  }));
}

function createRequestTakeTimes(medications: readonly CreatePrescriptionMedication[]): string[] {
  const uniqueTakeTimes = new Set<string>();
  medications.forEach((item) => {
    (item.takeTimes ?? []).forEach((takeTime) => {
      uniqueTakeTimes.add(takeTime);
    });
  });
  return MEDICATION_TAKE_SLOT_OPTIONS.map((option) => option.defaultTime).filter((time) =>
    uniqueTakeTimes.has(time),
  );
}

export function usePrescriptionScanResultViewModel() {
  const result = usePrescriptionOcrResultStore((state) => state.result);
  const clearResult = usePrescriptionOcrResultStore((state) => state.clearResult);
  const createMutation = useCreatePrescriptionByScanMutation();
  const shouldSuppressEmptyResultAlertRef = useRef<boolean>(false);
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null);

  const initialValues = useMemo<PrescriptionScanResultFormValues | null>(() => {
    if (!result) return null;
    return {
      title: result.draft.title,
      medications: result.draft.medications.map((item) => ({
        drugName: item.drugName,
        atcCode: item.atcCode,
        dosage: "",
        takeSlots: normalizeTakeTimesToSlots(result.draft.takeTimes),
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
    append({
      drugName: "",
      atcCode: EMPTY_MEDICATION_ATC_CODE,
      dosage: "",
      takeSlots: ["MORNING"],
    });
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

  const handlePressCompleteMedicationEdit = useCallback(() => {
    setEditingMedicationIndex(null);
  }, []);

  const handleChangeMedicationName = useCallback(
    (index: number, drugName: string) => {
      setValue(`medications.${index}.drugName`, drugName, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue(`medications.${index}.atcCode`, EMPTY_MEDICATION_ATC_CODE, {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue],
  );

  const handleSelectMedicationDrug = useCallback(
    (index: number, item: DrugSearchItem) => {
      setValue(`medications.${index}.drugName`, item.drugName, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue(`medications.${index}.atcCode`, item.atcCode, {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue],
  );

  const handleToggleMedicationTakeSlot = useCallback(
    (index: number, slot: MedicationTakeSlot) => {
      const fieldName = `medications.${index}.takeSlots` as const;
      const currentSlots = getValues(fieldName);
      const nextSlots = currentSlots.includes(slot)
        ? currentSlots.filter((item) => item !== slot)
        : [...currentSlots, slot];
      setValue(fieldName, nextSlots, { shouldDirty: true, shouldTouch: true });
    },
    [getValues, setValue],
  );

  const handleChangeMedicationDosage = useCallback(
    (index: number, dosage: string) => {
      setValue(`medications.${index}.dosage`, dosage, {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue],
  );

  const handlePressAnalyze = useCallback(async () => {
    if (!result) return;

    const values = getValues();
    const title = values.title.trim();
    const medications = createRequestMedications(values.medications);
    const takeTimes = createRequestTakeTimes(medications);

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
    if (medications.some((item) => item.atcCode.length === 0)) {
      Alert.alert("입력 확인", DRUG_NAME_NOT_SELECTED_ERROR);
      return;
    }
    if (medications.some((item) => (item.dosage ?? "").length === 0)) {
      Alert.alert("입력 확인", "복용량을 모두 입력해주세요.");
      return;
    }
    if (medications.some((item) => (item.takeTimes?.length ?? 0) === 0)) {
      Alert.alert("입력 확인", "각 약물마다 복약 시간을 최소 1개 선택해주세요.");
      return;
    }
    if (!takeTimes.length) {
      Alert.alert("입력 확인", "복약 시간을 최소 1개 이상 선택해주세요.");
      return;
    }

    const payload: CreatePrescriptionRequest = {
      title,
      startDate: result.draft.startDate,
      endDate: result.draft.endDate,
      takeTimes,
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
    handlePressCompleteMedicationEdit,
    handleChangeMedicationName,
    handleSelectMedicationDrug,
    handleToggleMedicationTakeSlot,
    handleChangeMedicationDosage,
    handlePressRemoveMedication,
  };
}
