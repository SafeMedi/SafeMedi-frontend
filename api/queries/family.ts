import { useQuery } from "@tanstack/react-query";

import { fetchFamilyManageOverview } from "@/api/endpoints/family";
import { queryKeys } from "@/api/query-keys";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 5 * 60 * 1000;

export function useFamilyManageOverview() {
  const accessToken = useSessionStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.family.manageOverview,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: fetchFamilyManageOverview,
  });
}
