import { useEffect, useMemo, useState } from "react";
import { type Control, Controller, useWatch } from "react-hook-form";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text, YStack } from "tamagui";
import { useSearchDrugsQuery } from "@/api/queries/drugs";
import type { DrugSearchItem } from "@/api/types";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import {
  MEDICATION_TAKE_SLOT_OPTIONS,
  type MedicationTakeSlot,
  type PrescriptionScanResultFormValues,
} from "../usePrescriptionScanResultViewModel";

interface MedicationEditorCardProps {
  readonly index: number;
  readonly control: Control<PrescriptionScanResultFormValues>;
  readonly isExpanded: boolean;
  readonly onPressRemove: () => void;
  readonly onPressEdit: () => void;
  readonly onPressComplete: () => void;
  readonly onChangeMedicationName: (index: number, drugName: string) => void;
  readonly onSelectMedicationDrug: (index: number, item: DrugSearchItem) => void;
  readonly onToggleMedicationTakeSlot: (index: number, slot: MedicationTakeSlot) => void;
}

const MIN_KEYWORD_LENGTH = 2;
const DEBOUNCE_DELAY_MS = 250;

export function MedicationEditorCard({
  index,
  control,
  isExpanded,
  onPressRemove,
  onPressEdit,
  onPressComplete,
  onChangeMedicationName,
  onSelectMedicationDrug,
  onToggleMedicationTakeSlot,
}: MedicationEditorCardProps) {
  const [keyword, setKeyword] = useState<string>("");
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>("");
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, DEBOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  const medicationName = useWatch({
    control,
    name: `medications.${index}.drugName`,
    defaultValue: "",
  });
  const atcCode = useWatch({
    control,
    name: `medications.${index}.atcCode`,
    defaultValue: "",
  });
  const selectedTakeSlots = useWatch({
    control,
    name: `medications.${index}.takeSlots`,
    defaultValue: [],
  });

  const isSearchEnabled = isExpanded && debouncedKeyword.length >= MIN_KEYWORD_LENGTH;
  const { data: searchResults, isFetching } = useSearchDrugsQuery(
    debouncedKeyword,
    isSearchEnabled,
  );

  const shouldShowSuggestions = useMemo(() => {
    return isExpanded && isInputFocused && isSearchEnabled;
  }, [isExpanded, isInputFocused, isSearchEnabled]);

  const takeSlotSummary = useMemo(() => {
    if (selectedTakeSlots.length === 0) {
      return "미선택";
    }
    return MEDICATION_TAKE_SLOT_OPTIONS.filter((option) => selectedTakeSlots.includes(option.slot))
      .map((option) => option.label)
      .join(", ");
  }, [selectedTakeSlots]);
  const isCompleteEnabled = useMemo(() => {
    const hasMedicationName = medicationName.trim().length > 0;
    const hasMedicationCode = atcCode.trim().length > 0;
    const hasTakeSlot = selectedTakeSlots.length > 0;
    return hasMedicationName && hasMedicationCode && hasTakeSlot;
  }, [atcCode, medicationName, selectedTakeSlots]);

  const handlePressSuggestion = (item: DrugSearchItem) => {
    setKeyword(item.drugName);
    setDebouncedKeyword(item.drugName);
    onSelectMedicationDrug(index, item);
    setIsInputFocused(false);
  };

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.indexText}>약물 {index + 1}</Text>
        <View style={styles.headerActions}>
          {isExpanded ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`약물 ${index + 1} 수정 완료`}
              onPress={onPressComplete}
              disabled={!isCompleteEnabled}
              style={({ pressed }) => [
                styles.completeButton,
                !isCompleteEnabled ? styles.disabledButton : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text
                style={[
                  styles.completeButtonText,
                  !isCompleteEnabled ? styles.disabledButtonText : null,
                ]}
              >
                완료
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`약물 ${index + 1} 수정`}
              onPress={onPressEdit}
              style={({ pressed }) => [styles.editButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.editButtonText}>수정</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`약물 ${index + 1} 삭제`}
            onPress={onPressRemove}
            style={({ pressed }) => [styles.removeButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.removeButtonText}>삭제</Text>
          </Pressable>
        </View>
      </View>

      {!isExpanded ? (
        <YStack gap={6}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>약물이름</Text>
            <Text style={styles.summaryValue}>{medicationName || "미입력"}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>복약 시간</Text>
            <Text style={styles.summaryValue}>{takeSlotSummary}</Text>
          </View>
          <Text style={[styles.metaText, atcCode ? styles.verifiedText : styles.unverifiedText]}>
            {atcCode ? `약물 코드: ${atcCode}` : "검색 결과에서 약물을 선택해야 등록됩니다."}
          </Text>
        </YStack>
      ) : null}

      {isExpanded ? (
        <>
          <YStack gap={8}>
            <Text style={styles.label}>약물이름</Text>
            <Controller
              control={control}
              name={`medications.${index}.drugName`}
              render={({ field: { value } }) => (
                <TextInput
                  value={value}
                  onChangeText={(nextValue) => {
                    setKeyword(nextValue);
                    onChangeMedicationName(index, nextValue);
                  }}
                  onFocus={() => {
                    setKeyword(value);
                    setIsInputFocused(true);
                  }}
                  onBlur={() => {
                    setIsInputFocused(false);
                  }}
                  placeholder="약물명을 한글로 입력 후 목록에서 선택"
                  placeholderTextColor={palette.input_placeholder}
                  style={styles.input}
                />
              )}
            />
            <Controller
              control={control}
              name={`medications.${index}.atcCode`}
              render={({ field: { value } }) => (
                <Text
                  style={[styles.metaText, value ? styles.verifiedText : styles.unverifiedText]}
                >
                  {value ? `약물 코드: ${value}` : "검색 결과에서 약물을 선택해야 등록됩니다."}
                </Text>
              )}
            />
            {shouldShowSuggestions ? (
              <View style={styles.suggestionContainer}>
                {isFetching ? <Text style={styles.metaText}>검색 중...</Text> : null}
                {!isFetching && (searchResults?.length ?? 0) === 0 ? (
                  <Text style={styles.metaText}>검색 결과가 없습니다.</Text>
                ) : null}
                {(searchResults ?? []).map((item) => (
                  <Pressable
                    key={`${item.atcCode}-${item.drugName}`}
                    onPressIn={() => handlePressSuggestion(item)}
                    style={({ pressed }) => [
                      styles.suggestionItem,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.suggestionTitle}>{item.drugName}</Text>
                    <Text style={styles.suggestionMeta}>
                      {item.company} · {item.atcCode}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </YStack>

          <YStack gap={8}>
            <Text style={styles.label}>복약 시간 선택</Text>
            <Controller
              control={control}
              name={`medications.${index}.takeSlots`}
              render={({ field: { value } }) => (
                <>
                  <View style={styles.slotRow}>
                    {MEDICATION_TAKE_SLOT_OPTIONS.map((option) => {
                      const isSelected = value.includes(option.slot);
                      return (
                        <Pressable
                          key={option.slot}
                          onPress={() => onToggleMedicationTakeSlot(index, option.slot)}
                          style={({ pressed }) => [
                            styles.slotButton,
                            isSelected ? styles.slotButtonSelected : null,
                            pressed ? styles.pressed : null,
                          ]}
                        >
                          <Text
                            style={[styles.slotLabel, isSelected ? styles.slotLabelSelected : null]}
                          >
                            {option.label}
                          </Text>
                          <Text
                            style={[
                              styles.slotTimeRange,
                              isSelected ? styles.slotTimeRangeSelected : null,
                            ]}
                          >
                            {option.timeRange}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {value.length === 0 ? (
                    <Text style={styles.requiredText}>
                      최소 1개 이상의 복약 시간을 선택해주세요.
                    </Text>
                  ) : null}
                </>
              )}
            />
          </YStack>
        </>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderColor: palette.purple,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  indexText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  removeButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.surface_subtle,
  },
  editButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.gray,
  },
  completeButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: palette.green,
  },
  removeButtonText: {
    color: palette.red_medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  editButtonText: {
    color: palette.purple,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  completeButtonText: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: palette.border_muted,
  },
  disabledButtonText: {
    color: palette.icon,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  summaryLabel: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  summaryValue: {
    color: palette.black,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  label: {
    color: palette.black,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  input: {
    backgroundColor: palette.gray,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    lineHeight: 20,
    color: palette.black,
  },
  metaText: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 16,
  },
  verifiedText: {
    color: palette.green,
  },
  unverifiedText: {
    color: palette.red_medium,
  },
  suggestionContainer: {
    borderWidth: 1,
    borderColor: palette.border_muted,
    backgroundColor: palette.white,
    borderRadius: 10,
    paddingVertical: 4,
    gap: 2,
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  suggestionTitle: {
    color: palette.black,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  suggestionMeta: {
    color: palette.icon,
    fontSize: 11,
    lineHeight: 15,
  },
  slotRow: {
    flexDirection: "row",
    gap: 8,
  },
  slotButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border_muted,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    backgroundColor: palette.surface_subtle,
  },
  slotButtonSelected: {
    borderColor: palette.purple,
    backgroundColor: palette.gray,
  },
  slotLabel: {
    color: palette.black,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  slotLabelSelected: {
    color: palette.purple,
  },
  slotTimeRange: {
    color: palette.icon,
    fontSize: 10,
    lineHeight: 14,
  },
  slotTimeRangeSelected: {
    color: palette.purple,
  },
  requiredText: {
    color: palette.red_medium,
    fontSize: 11,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
