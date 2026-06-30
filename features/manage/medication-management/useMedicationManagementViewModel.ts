import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import {
  useDeletePrescriptionMutation,
  usePrescriptionsQuery,
  useUpdatePrescriptionMutation,
} from "@/api/queries/prescriptions";
import type { MedicationTakeSlot } from "@/features/scan/prescription-scan-result/usePrescriptionScanResultViewModel";
import {
  buildUpdatedMedicationsAfterEdit,
  createMedicationEditDraft,
  createMedicationEditKey,
  isMedicationEditDraftSavable,
  isMedicationEditing,
  type MedicationEditDraft,
  type MedicationEditKey,
  toggleMedicationEditTakeSlot,
  validateMedicationEditDraft,
} from "./medicationEditModel";
import {
  buildUpdatedMedicationsAfterDelete,
  isPrescriptionExpanded,
  type MedicationManagementViewModel,
  mapPrescriptionsToManagementGroups,
  toggleCollapsedPrescriptionId,
} from "./medicationManagementModel";

export function useMedicationManagementViewModel(): MedicationManagementViewModel {
  const prescriptionsQuery = usePrescriptionsQuery();
  const updatePrescriptionMutation = useUpdatePrescriptionMutation();
  const deletePrescriptionMutation = useDeletePrescriptionMutation();

  const [collapsedPrescriptionIds, setCollapsedPrescriptionIds] = useState<ReadonlySet<number>>(
    () => new Set<number>(),
  );
  const [editingMedicationKey, setEditingMedicationKey] = useState<MedicationEditKey | null>(null);
  const [editDraft, setEditDraft] = useState<MedicationEditDraft | null>(null);

  const prescriptions = prescriptionsQuery.data?.prescriptions ?? [];

  const prescriptionGroups = useMemo(
    () => mapPrescriptionsToManagementGroups(prescriptions),
    [prescriptions],
  );

  const isSaveEditEnabled = useMemo(() => isMedicationEditDraftSavable(editDraft), [editDraft]);

  const handleTogglePrescriptionExpanded = useCallback((prescriptionId: number) => {
    setCollapsedPrescriptionIds((currentIds) =>
      toggleCollapsedPrescriptionId(currentIds, prescriptionId),
    );
  }, []);

  const checkPrescriptionExpanded = useCallback(
    (prescriptionId: number) => isPrescriptionExpanded(collapsedPrescriptionIds, prescriptionId),
    [collapsedPrescriptionIds],
  );

  const checkMedicationEditing = useCallback(
    (prescriptionId: number, medicationId: number) =>
      isMedicationEditing(editingMedicationKey, prescriptionId, medicationId),
    [editingMedicationKey],
  );

  const handleCancelEditMedication = useCallback(() => {
    setEditingMedicationKey(null);
    setEditDraft(null);
  }, []);

  const handleStartEditMedication = useCallback(
    (prescriptionId: number, medicationId: number) => {
      const prescription = prescriptions.find((item) => item.prescriptionId === prescriptionId);
      if (!prescription) {
        return;
      }

      const nextDraft = createMedicationEditDraft(prescription, medicationId);
      if (!nextDraft) {
        return;
      }

      setEditingMedicationKey(createMedicationEditKey(prescriptionId, medicationId));
      setEditDraft(nextDraft);
    },
    [prescriptions],
  );

  const handleToggleEditTakeSlot = useCallback((slot: MedicationTakeSlot) => {
    setEditDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }
      return toggleMedicationEditTakeSlot(currentDraft, slot);
    });
  }, []);

  const handleSaveEditMedication = useCallback(() => {
    if (!editingMedicationKey || !editDraft) {
      return;
    }

    const validation = validateMedicationEditDraft(editDraft);
    if (!validation.isValid) {
      Alert.alert("입력 확인", validation.message ?? "입력값을 확인해주세요.");
      return;
    }

    const prescription = prescriptions.find(
      (item) => item.prescriptionId === editingMedicationKey.prescriptionId,
    );
    if (!prescription) {
      return;
    }

    updatePrescriptionMutation.mutate(
      {
        prescriptionId: editingMedicationKey.prescriptionId,
        body: {
          medications: buildUpdatedMedicationsAfterEdit(
            prescription,
            editingMedicationKey.medicationId,
            editDraft,
          ),
        },
      },
      {
        onSuccess: () => {
          setEditingMedicationKey(null);
          setEditDraft(null);
        },
        onError: () => {
          Alert.alert("저장 실패", "약물 수정에 실패했습니다. 잠시 후 다시 시도해주세요.");
        },
      },
    );
  }, [editDraft, editingMedicationKey, prescriptions, updatePrescriptionMutation]);

  const handleDeleteMedication = useCallback(
    (prescriptionId: number, medicationId: number, drugName: string) => {
      if (isMedicationEditing(editingMedicationKey, prescriptionId, medicationId)) {
        handleCancelEditMedication();
      }

      const prescription = prescriptions.find((item) => item.prescriptionId === prescriptionId);
      if (!prescription) {
        return;
      }

      Alert.alert("약물 삭제", `'${drugName}' 약물을 삭제할까요?`, [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            const updatedMedications = buildUpdatedMedicationsAfterDelete(
              prescription,
              medicationId,
            );

            if (updatedMedications.length > 0) {
              Alert.alert(
                "삭제 불가",
                "현재 API는 개별 약물 삭제를 지원하지 않습니다. 처방전 전체 삭제 후 다시 등록해주세요.",
              );
              return;
            }

            if (updatedMedications.length === 0) {
              deletePrescriptionMutation.mutate(prescriptionId, {
                onError: () => {
                  Alert.alert("삭제 실패", "약물 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
                },
              });
              return;
            }
          },
        },
      ]);
    },
    [deletePrescriptionMutation, editingMedicationKey, handleCancelEditMedication, prescriptions],
  );

  const handleDeletePrescription = useCallback(
    (prescriptionId: number, title: string) => {
      if (editingMedicationKey?.prescriptionId === prescriptionId) {
        handleCancelEditMedication();
      }

      Alert.alert("처방전 삭제", `'${title}' 처방전과 예정된 복약 스케줄을 삭제할까요?`, [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            deletePrescriptionMutation.mutate(prescriptionId, {
              onError: () => {
                Alert.alert("삭제 실패", "처방전 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
              },
            });
          },
        },
      ]);
    },
    [deletePrescriptionMutation, editingMedicationKey, handleCancelEditMedication],
  );

  return {
    prescriptionGroups,
    isPrescriptionExpanded: checkPrescriptionExpanded,
    editingMedicationKey,
    editDraft,
    isMedicationEditing: checkMedicationEditing,
    isSaveEditEnabled,
    isLoading: prescriptionsQuery.isLoading,
    isError: prescriptionsQuery.isError,
    isMutating: updatePrescriptionMutation.isPending || deletePrescriptionMutation.isPending,
    refetch: () => prescriptionsQuery.refetch(),
    togglePrescriptionExpanded: handleTogglePrescriptionExpanded,
    startEditMedication: handleStartEditMedication,
    cancelEditMedication: handleCancelEditMedication,
    toggleEditTakeSlot: handleToggleEditTakeSlot,
    saveEditMedication: handleSaveEditMedication,
    handleDeleteMedication,
    handleDeletePrescription,
  };
}
