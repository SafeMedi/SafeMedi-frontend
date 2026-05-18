import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { DrugSearchItem } from "@/api/types";

const MIN_SEARCH_KEYWORD_LENGTH = 2;

const DRUG_SEARCH_FALLBACK_MOCKS: readonly DrugSearchItem[] = [
  { atcCode: "J01CA04", drugName: "종근당아목시실린캡슐500mg", company: "종근당" },
  { atcCode: "J01CA04", drugName: "보령아목시실린캡슐", company: "보령제약" },
  { atcCode: "J01CA04", drugName: "아목시실린시럽", company: "유한양행" },
  { atcCode: "N02BE01", drugName: "타이레놀정500mg", company: "한국얀센" },
  { atcCode: "A02BC01", drugName: "오메프라졸캡슐20mg", company: "한미약품" },
] as const;

function filterDrugSearchMocks(keyword: string): readonly DrugSearchItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (normalizedKeyword.length < MIN_SEARCH_KEYWORD_LENGTH) {
    return [];
  }
  return DRUG_SEARCH_FALLBACK_MOCKS.filter((item) =>
    item.drugName.toLowerCase().includes(normalizedKeyword),
  );
}

export async function searchDrugs(keyword: string): Promise<readonly DrugSearchItem[]> {
  const normalizedKeyword = keyword.trim();
  if (normalizedKeyword.length < MIN_SEARCH_KEYWORD_LENGTH) {
    return [];
  }

  try {
    return await api
      .get(apiPaths.drugsSearch, { searchParams: { keyword: normalizedKeyword } })
      .json<DrugSearchItem[]>();
  } catch (error) {
    if (__DEV__) {
      return filterDrugSearchMocks(normalizedKeyword);
    }
    throw error;
  }
}
