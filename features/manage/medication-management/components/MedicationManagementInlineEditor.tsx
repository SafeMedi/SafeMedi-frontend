import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text, YStack } from "tamagui";

import { useSearchDrugsQuery } from "@/api/queries/drugs";
import type { DrugSearchItem } from "@/api/types";
import { palette } from "@/constants/design-tokens";
import {
  MEDICATION_TAKE_SLOT_OPTIONS,
  type MedicationTakeSlot,
} from "@/features/scan/prescription-scan-result/usePrescriptionScanResultViewModel";
import type { MedicationEditDraft } from "../medicationEditModel";

interface MedicationManagementInlineEditorProps {
  readonly draft: MedicationEditDraft;
  readonly isSaveEnabled: boolean;
  readonly isSaving: boolean;
  readonly onChangeDrugName: (drugName: string) => void;
  readonly onSelectDrug: (item: DrugSearchItem) => void;
  readonly onToggleTakeSlot: (slot: MedicationTakeSlot) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

const MIN_KEYWORD_LENGTH = 2;
const DEBOUNCE_DELAY_MS = 250;

export function MedicationManagementInlineEditor({
  draft,
  isSaveEnabled,
  isSaving,
  onChangeDrugName,
  onSelectDrug,
  onToggleTakeSlot,
  onCancel,
  onSave,
}: MedicationManagementInlineEditorProps) {
  const [keyword, setKeyword] = useState<string>(draft.drugName);
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>(draft.drugName.trim());
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  useEffect(() => {
    setKeyword(draft.drugName);
    setDebouncedKeyword(draft.drugName.trim());
  }, [draft.drugName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, DEBOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  const isSearchEnabled = debouncedKeyword.length >= MIN_KEYWORD_LENGTH;
  const { data: searchResults, isFetching } = useSearchDrugsQuery(
    debouncedKeyword,
    isSearchEnabled,
  );

  const shouldShowSuggestions = isInputFocused && isSearchEnabled;

  const handlePressSuggestion = (item: DrugSearchItem) => {
    setKeyword(item.drugName);
    setDebouncedKeyword(item.drugName);
    onSelectDrug(item);
    setIsInputFocused(false);
  };

  return (
    <YStack gap={12}>
      <YStack gap={8}>
        <Text style={styles.label}>약물이름</Text>
        <TextInput
          value={draft.drugName}
          onChangeText={(nextValue) => {
            setKeyword(nextValue);
            onChangeDrugName(nextValue);
          }}
          onFocus={() => {
            setKeyword(draft.drugName);
            setIsInputFocused(true);
          }}
          onBlur={() => {
            setIsInputFocused(false);
          }}
          placeholder="약물명을 한글로 입력 후 목록에서 선택"
          placeholderTextColor={palette.input_placeholder}
          style={styles.input}
        />
        <Text
          style={[styles.metaText, draft.atcCode ? styles.verifiedText : styles.unverifiedText]}
        >
          {draft.atcCode
            ? `약물 코드: ${draft.atcCode}`
            : "검색 결과에서 약물을 선택해야 저장할 수 있습니다."}
        </Text>
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
                style={({ pressed }) => [styles.suggestionItem, pressed ? styles.pressed : null]}
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
        <View style={styles.slotRow}>
          {MEDICATION_TAKE_SLOT_OPTIONS.map((option) => {
            const isSelected = draft.takeSlots.includes(option.slot);
            return (
              <Pressable
                key={option.slot}
                onPress={() => onToggleTakeSlot(option.slot)}
                style={({ pressed }) => [
                  styles.slotButton,
                  isSelected ? styles.slotButtonSelected : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={[styles.slotLabel, isSelected ? styles.slotLabelSelected : null]}>
                  {option.label}
                </Text>
                <Text
                  style={[styles.slotTimeRange, isSelected ? styles.slotTimeRangeSelected : null]}
                >
                  {option.timeRange}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {draft.takeSlots.length === 0 ? (
          <Text style={styles.requiredText}>최소 1개 이상의 복약 시간을 선택해주세요.</Text>
        ) : null}
      </YStack>

      <View style={styles.actionDivider} />
      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="수정 취소"
          onPress={onCancel}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.actionButton,
            styles.cancelButton,
            pressed ? styles.pressed : null,
            isSaving ? styles.disabled : null,
          ]}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="수정 저장"
          onPress={onSave}
          disabled={!isSaveEnabled || isSaving}
          style={({ pressed }) => [
            styles.actionButton,
            styles.saveButton,
            pressed ? styles.pressed : null,
            !isSaveEnabled || isSaving ? styles.disabled : null,
          ]}
        >
          <Text style={styles.saveButtonText}>{isSaving ? "저장 중..." : "저장"}</Text>
        </Pressable>
      </View>
    </YStack>
  );
}

const styles = StyleSheet.create({
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
  actionDivider: {
    borderTopWidth: 1,
    borderTopColor: palette.dark_gray,
    marginTop: 2,
    paddingTop: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 7,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
  },
  cancelButton: {
    borderColor: palette.dark_gray,
    backgroundColor: palette.gray,
  },
  saveButton: {
    borderColor: palette.green_soft,
    backgroundColor: palette.risk_safe_badge_bg,
  },
  cancelButtonText: {
    color: palette.black,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  saveButtonText: {
    color: palette.green_deep,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});
