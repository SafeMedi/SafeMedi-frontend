import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { Input, Text, XStack, YStack } from "tamagui";
import { useSearchDrugsQuery } from "@/api/queries/drugs";
import type { TutorialAllergyItem } from "@/api/types/tutorial";
import { SelectChip } from "@/components/ui/SelectChip";
import { palette } from "@/constants/design-tokens";
import {
  representativeFoodAllergyOptions,
  representativeMedicineAllergyOptions,
} from "@/constants/health-profile-options";
import type { StepHandle } from "@/features/tutorial/types";
import { useUserStore } from "@/stores/userStore";
import { toggleSelection } from "@/utils/array";
import { isCloseToScrollEnd } from "@/utils/scroll";

const medicineAllergyLabels: readonly string[] = representativeMedicineAllergyOptions.map(
  (option) => option.label,
);
const foodAllergyLabels: readonly string[] = representativeFoodAllergyOptions.map(
  (option) => option.label,
);
const MIN_ALLERGY_SEARCH_KEYWORD_LENGTH = 2;
const ALLERGY_SEARCH_DEBOUNCE_DELAY_MS = 250;
const MAX_VISIBLE_SEARCH_RESULTS = 5;
const SEARCH_RESULT_ITEM_HEIGHT = 54;
const SEARCH_RESULT_LIST_MAX_HEIGHT = SEARCH_RESULT_ITEM_HEIGHT * MAX_VISIBLE_SEARCH_RESULTS;

export const Step2 = forwardRef<StepHandle>(function Step2(_props, ref) {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const [selectedMedicine, setSelectedMedicine] = useState<string[]>(() =>
    (user?.allergies ?? []).filter((item) => medicineAllergyLabels.includes(item)),
  );
  const [selectedFood, setSelectedFood] = useState<string[]>(() =>
    (user?.allergies ?? []).filter((item) => foodAllergyLabels.includes(item)),
  );
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchInput, setDebouncedSearchInput] = useState("");
  const [selectedSearchAllergies, setSelectedSearchAllergies] = useState<string[]>(() =>
    (user?.allergies ?? []).filter(
      (item) => !medicineAllergyLabels.includes(item) && !foodAllergyLabels.includes(item),
    ),
  );
  const [selectedSearchAllergyItems, setSelectedSearchAllergyItems] = useState<
    Record<string, TutorialAllergyItem>
  >(() => user?.allergyMappings ?? {});

  const allSelectedAllergies = useMemo(
    () => [...selectedMedicine, ...selectedFood, ...selectedSearchAllergies],
    [selectedFood, selectedMedicine, selectedSearchAllergies],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchInput(searchInput.trim());
    }, ALLERGY_SEARCH_DEBOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isSearchEnabled = debouncedSearchInput.length >= MIN_ALLERGY_SEARCH_KEYWORD_LENGTH;
  const {
    items: searchResults,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSearchDrugsQuery(debouncedSearchInput, isSearchEnabled);

  const filteredSearchResults = useMemo(() => {
    if (!isSearchEnabled) return [];
    return searchResults.filter((item) => !allSelectedAllergies.includes(item.drugName));
  }, [allSelectedAllergies, isSearchEnabled, searchResults]);

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleSelectSearchResult = (item: (typeof filteredSearchResults)[number]) => {
    const label = item.drugName;
    if (!allSelectedAllergies.includes(label)) {
      setSelectedSearchAllergies((prev) => [...prev, label]);
    }
    setSelectedSearchAllergyItems((prev) => ({
      ...prev,
      [label]: {
        type: "ATC_GROUP",
        value: item.atcCode,
        name: item.drugName,
      },
    }));
    setSearchInput("");
  };

  useImperativeHandle(
    ref,
    () => ({
      submit: () =>
        new Promise<boolean>((resolve) => {
          updateUser({
            allergies: [...selectedMedicine, ...selectedFood, ...selectedSearchAllergies],
            allergyMappings: selectedSearchAllergyItems,
          });
          resolve(true);
        }),
    }),
    [
      selectedFood,
      selectedMedicine,
      selectedSearchAllergies,
      selectedSearchAllergyItems,
      updateUser,
    ],
  );

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
    >
      <YStack gap={20} pt={8} pb={16}>
        <YStack items="center" gap={10} mt={8}>
          <LinearGradient
            colors={[palette.red, palette.orange]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 82,
              height: 82,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="warning-outline" size={42} color={palette.white} />
          </LinearGradient>
          <Text fontSize={18} fontWeight="700" color={palette.black}>
            알러지 정보
          </Text>
          <Text fontSize={16} color={palette.icon}>
            위험한 약물을 미리 차단하세요
          </Text>
        </YStack>

        <AllergySection
          title="💊 약물 알러지"
          options={medicineAllergyLabels}
          selectedItems={selectedMedicine}
          onToggle={(item) => setSelectedMedicine((prev) => toggleSelection(prev, item))}
        />

        <AllergySection
          title="🍽️ 식품 알러지"
          options={foodAllergyLabels}
          selectedItems={selectedFood}
          onToggle={(item) => setSelectedFood((prev) => toggleSelection(prev, item))}
        />

        <YStack gap={10}>
          <Text fontSize={14} fontWeight="600" color={palette.black}>
            🔎 알러지 검색
          </Text>

          <Input
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="알러지 약물명 검색"
            bg={palette.gray}
            fontSize={15}
            style={{
              color: palette.black,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.dark_gray,
            }}
          />

          {isSearchEnabled ? (
            <ScrollView
              style={styles.searchResults}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              onScroll={(event) => {
                if (isCloseToScrollEnd(event.nativeEvent)) {
                  handleEndReached();
                }
              }}
            >
              {isFetching ? (
                <Text style={styles.searchMetaText}>검색 중...</Text>
              ) : filteredSearchResults.length > 0 ? (
                <>
                  {filteredSearchResults.map((item) => (
                    <Pressable
                      key={`${item.drugCode}:${item.atcCode}:${item.drugName}`}
                      onPress={() => handleSelectSearchResult(item)}
                      style={styles.searchResultItem}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.drugName} 검색 결과 선택`}
                    >
                      <Text style={styles.searchResultTitle}>{item.drugName}</Text>
                      <Text style={styles.searchResultMeta}>
                        {item.company ? `${item.company} · ${item.atcCode}` : item.atcCode}
                      </Text>
                    </Pressable>
                  ))}
                  {isFetchingNextPage ? (
                    <Text style={styles.searchMetaText}>불러오는 중...</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.searchMetaText}>검색 결과가 없습니다.</Text>
              )}
            </ScrollView>
          ) : null}

          {selectedSearchAllergies.length > 0 ? (
            <XStack gap={8} flexWrap="wrap">
              {selectedSearchAllergies.map((item) => (
                <SelectChip
                  key={item}
                  label={item}
                  selected
                  borderWidth={0}
                  unselectedBackground={palette.dark_gray}
                  selectedBackground={palette.orange}
                  onPress={() => {
                    setSelectedSearchAllergies((prev) => prev.filter((value) => value !== item));
                    setSelectedSearchAllergyItems((prev) => {
                      const next = { ...prev };
                      delete next[item];
                      return next;
                    });
                  }}
                />
              ))}
            </XStack>
          ) : null}

          <Text fontSize={12} color={palette.icon} style={{ textAlign: "center" }}>
            선택하신 알러지 성분이 포함된 약물은 자동으로 경고됩니다
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  searchResults: {
    maxHeight: SEARCH_RESULT_LIST_MAX_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.dark_gray,
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  searchResultItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.dark_gray,
  },
  searchResultTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: palette.black,
  },
  searchResultMeta: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: palette.icon,
  },
  searchMetaText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    lineHeight: 17,
    color: palette.icon,
  },
});

type AllergySectionProps = {
  title: string;
  options: readonly string[];
  selectedItems: string[];
  onToggle: (item: string) => void;
};

function AllergySection({ title, options, selectedItems, onToggle }: AllergySectionProps) {
  return (
    <YStack gap={10}>
      <Text fontSize={14} fontWeight="600" color={palette.black}>
        {title}
      </Text>
      <XStack gap={8} flexWrap="wrap">
        {options.map((item) => (
          <SelectChip
            key={item}
            label={item}
            selected={selectedItems.includes(item)}
            borderWidth={0}
            unselectedBackground={palette.dark_gray}
            selectedBackground={palette.orange}
            onPress={() => onToggle(item)}
          />
        ))}
      </XStack>
    </YStack>
  );
}
