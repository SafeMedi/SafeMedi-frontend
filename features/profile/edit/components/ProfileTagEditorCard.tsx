import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "tamagui";

import { Badge } from "@/components/ui/Badge";
import { SelectChip } from "@/components/ui/SelectChip";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { isCloseToScrollEnd } from "@/utils/scroll";

import {
  PROFILE_EDIT_QUICK_ITEMS,
  PROFILE_EDIT_SECTION_STYLES,
  type ProfileEditSectionVariant,
} from "../constants";

const MAX_VISIBLE_SEARCH_RESULTS = 5;
const SEARCH_RESULT_ITEM_HEIGHT = 54;
const SEARCH_RESULT_LIST_MAX_HEIGHT = SEARCH_RESULT_ITEM_HEIGHT * MAX_VISIBLE_SEARCH_RESULTS;

export type ProfileTagSearchResult = {
  readonly id: string;
  readonly label: string;
  readonly meta?: string;
  readonly type: "ATC_GROUP" | "INGREDIENT" | "FOOD";
  readonly value: string;
  readonly name: string;
};

export type ProfileTagEditorCardProps = {
  variant: ProfileEditSectionVariant;
  title: string;
  items: readonly string[];
  inputValue: string;
  inputPlaceholder: string;
  onInputChange: (value: string) => void;
  onAddItem: (value: string) => void;
  onRemoveItem: (value: string) => void;
  inputMode?: "custom" | "search" | "hidden";
  searchResults?: readonly ProfileTagSearchResult[];
  isSearchFetching?: boolean;
  isSearchFetchingNextPage?: boolean;
  hasMoreSearchResults?: boolean;
  onSelectSearchResult?: (value: ProfileTagSearchResult) => void;
  onLoadMoreSearchResults?: () => void;
};

export function ProfileTagEditorCard({
  variant,
  title,
  items,
  inputValue,
  inputPlaceholder,
  onInputChange,
  onAddItem,
  onRemoveItem,
  inputMode = "custom",
  searchResults = [],
  isSearchFetching = false,
  isSearchFetchingNextPage = false,
  hasMoreSearchResults = false,
  onSelectSearchResult,
  onLoadMoreSearchResults,
}: ProfileTagEditorCardProps) {
  const style = PROFILE_EDIT_SECTION_STYLES[variant];
  const quickItems = PROFILE_EDIT_QUICK_ITEMS[variant];
  const isSearchMode = inputMode === "search";
  const shouldShowInput = inputMode !== "hidden";
  const shouldShowSearchResults = isSearchMode && inputValue.trim().length > 0;

  const handleEndReached = () => {
    if (hasMoreSearchResults && !isSearchFetchingNextPage) {
      onLoadMoreSearchResults?.();
    }
  };

  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.tagsWrap}>
        {items.map((item) => (
          <Badge
            key={item}
            label={item}
            backgroundColor={style.tagBackground}
            textColor={palette.white}
            style={styles.tag}
            textStyle={styles.tagText}
            rightElement={
              <Pressable hitSlop={8} onPress={() => onRemoveItem(item)}>
                <Ionicons name="close" size={12} color={palette.white} />
              </Pressable>
            }
          />
        ))}
      </View>

      {shouldShowInput ? (
        <>
          <View style={styles.inputRow}>
            <TextInput
              value={inputValue}
              onChangeText={onInputChange}
              placeholder={inputPlaceholder}
              placeholderTextColor={palette.input_placeholder}
              style={styles.input}
              returnKeyType={isSearchMode ? "search" : "done"}
              onSubmitEditing={() => {
                if (!isSearchMode) {
                  onAddItem(inputValue);
                }
              }}
            />
            {isSearchMode ? null : (
              <Pressable onPress={() => onAddItem(inputValue)} hitSlop={6}>
                <LinearGradient
                  colors={[...style.addButtonGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButton}
                >
                  <Ionicons name="add" size={14} color={palette.white} />
                </LinearGradient>
              </Pressable>
            )}
          </View>

          {shouldShowSearchResults ? (
            <View style={styles.searchResults}>
              {isSearchFetching && searchResults.length === 0 ? (
                <Text style={styles.emptySearchText}>검색 중...</Text>
              ) : null}
              {!isSearchFetching && searchResults.length === 0 ? (
                <Text style={styles.emptySearchText}>검색 결과가 없습니다.</Text>
              ) : null}
              {searchResults.length > 0 && onSelectSearchResult ? (
                <ScrollView
                  style={styles.searchResultsList}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  scrollEventThrottle={16}
                  onScroll={(event) => {
                    if (isCloseToScrollEnd(event.nativeEvent)) {
                      handleEndReached();
                    }
                  }}
                >
                  {searchResults.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => onSelectSearchResult(item)}
                      style={styles.searchResultItem}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.label} 검색 결과 선택`}
                    >
                      <Text style={styles.searchResultText}>{item.label}</Text>
                      {item.meta ? <Text style={styles.searchResultMeta}>{item.meta}</Text> : null}
                    </Pressable>
                  ))}
                  {isSearchFetchingNextPage ? (
                    <Text style={styles.emptySearchText}>불러오는 중...</Text>
                  ) : null}
                </ScrollView>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}

      <View style={styles.quickWrap}>
        <Text style={styles.quickLabel}>빠른 추가:</Text>
        <View style={styles.quickItems}>
          {quickItems.map((item) => (
            <SelectChip
              key={item}
              label={`+ ${item}`}
              selected={false}
              onPress={() => onAddItem(item)}
              height={27}
              px={10}
              borderWidth={1}
              unselectedBackground={style.quickTagBackground}
              unselectedBorderColor={style.quickTagBorder}
              unselectedTextColor={style.quickTagText}
              textFontSize={11}
              textFontWeight="400"
            />
          ))}
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 14,
  },
  title: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: palette.black,
    letterSpacing: -0.15,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    height: 30,
    paddingHorizontal: 10,
  },
  tagText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: palette.white,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: palette.gray,
    paddingHorizontal: 10,
    fontSize: 14,
    color: palette.black,
  },
  addButton: {
    width: 35,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickWrap: {
    gap: 6,
  },
  quickLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: palette.icon,
  },
  quickItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  searchResults: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.dark_gray,
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  searchResultsList: {
    maxHeight: SEARCH_RESULT_LIST_MAX_HEIGHT,
  },
  searchResultItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.dark_gray,
  },
  searchResultText: {
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
  emptySearchText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    lineHeight: 17,
    color: palette.icon,
  },
});
