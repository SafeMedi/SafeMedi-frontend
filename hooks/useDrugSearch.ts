import { useMemo } from "react";
import { useSearchDrugsQuery } from "@/api/queries/drugs";
import type { DrugSearchItem } from "@/api/types";
import { useDebouncedValue } from "./useDebouncedValue";

const DEFAULT_MIN_KEYWORD_LENGTH = 2;
const DEFAULT_DEBOUNCE_MS = 250;

export interface UseDrugSearchOptions {
  readonly keyword: string;
  readonly minKeywordLength?: number;
  readonly debounceMs?: number;
  /** 이미 선택된 약물명 등 검색 결과에서 제외할 이름 목록 */
  readonly excludeNames?: readonly string[];
}

export interface UseDrugSearchResult {
  readonly items: readonly DrugSearchItem[];
  readonly isFetching: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasNextPage: boolean;
  /** debounce 된 키워드가 최소 길이를 만족해 검색이 활성화된 상태 */
  readonly isSearchEnabled: boolean;
  readonly loadMore: () => void;
}

/**
 * 약물(ATC) 검색 공통 로직.
 * debounce + 최소 길이 게이트 + 무한스크롤 + 제외 필터를 한곳에서 관리한다.
 */
export function useDrugSearch({
  keyword,
  minKeywordLength = DEFAULT_MIN_KEYWORD_LENGTH,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  excludeNames,
}: UseDrugSearchOptions): UseDrugSearchResult {
  const debouncedKeyword = useDebouncedValue(keyword.trim(), debounceMs);
  const isSearchEnabled = debouncedKeyword.length >= minKeywordLength;

  const { items, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } = useSearchDrugsQuery(
    debouncedKeyword,
    isSearchEnabled,
  );

  const filteredItems = useMemo<readonly DrugSearchItem[]>(() => {
    if (!excludeNames || excludeNames.length === 0) return items;
    const excludeSet = new Set(excludeNames);
    return items.filter((item) => !excludeSet.has(item.drugName));
  }, [items, excludeNames]);

  return {
    items: filteredItems,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    isSearchEnabled,
    loadMore: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  };
}
