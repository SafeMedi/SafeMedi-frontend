import { useEffect, useMemo, useState } from "react";
import { type Control, Controller } from "react-hook-form";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text, YStack } from "tamagui";
import { useSearchDrugsQuery } from "@/api/queries/drugs";
import type { DrugSearchItem } from "@/api/types";
import { palette } from "@/constants/design-tokens";
import type { PrescriptionScanResultFormValues } from "../usePrescriptionScanResultViewModel";

interface MedicationDrugSearchFieldProps {
  readonly index: number;
  readonly control: Control<PrescriptionScanResultFormValues>;
  readonly onChangeMedicationName: (index: number, drugName: string) => void;
  readonly onSelectMedicationDrug: (index: number, item: DrugSearchItem) => void;
}

const MIN_KEYWORD_LENGTH = 2;
const DEBOUNCE_DELAY_MS = 250;

export function MedicationDrugSearchField({
  index,
  control,
  onChangeMedicationName,
  onSelectMedicationDrug,
}: MedicationDrugSearchFieldProps) {
  const [keyword, setKeyword] = useState<string>("");
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>("");
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

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

  const shouldShowSuggestions = useMemo(() => {
    return isInputFocused && isSearchEnabled;
  }, [isInputFocused, isSearchEnabled]);

  const handlePressSuggestion = (item: DrugSearchItem) => {
    setKeyword(item.drugName);
    setDebouncedKeyword(item.drugName);
    onSelectMedicationDrug(index, item);
    setIsInputFocused(false);
  };

  return (
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
          <Text style={[styles.metaText, value ? styles.verifiedText : styles.unverifiedText]}>
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
  pressed: {
    opacity: 0.8,
  },
});
