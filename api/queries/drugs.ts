import { useQuery } from "@tanstack/react-query";
import { searchDrugs } from "@/api/endpoints/drugs";
import { queryKeys } from "@/api/query-keys";

export function useSearchDrugsQuery(keyword: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.scan.searchDrugs(keyword),
    queryFn: () => searchDrugs(keyword),
    enabled,
    staleTime: 60_000,
  });
}
