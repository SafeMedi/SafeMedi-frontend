import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/query-keys";
import type { TutorialRegistrationBody } from "@/api/types/tutorial";
import {
  fetchUserProfile,
  fetchUserProfileWithAccessToken,
  postSocialLogin,
  postTutorialRegistration,
} from "@/api/user-api";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 5 * 60 * 1000;
const GC_MS = 1000 * 60 * 60 * 24;

export function useUserProfile() {
  const accessToken = useSessionStore((s) => s.accessToken);
  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: fetchUserProfile,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setAccessToken = useSessionStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: ({ provider, accessToken }: { provider: "kakao" | "naver"; accessToken: string }) =>
      postSocialLogin(provider, accessToken),
    onSuccess: async (data) => {
      if (!data?.accessToken) return;
      setAccessToken(data.accessToken);
      await queryClient.fetchQuery({
        queryKey: queryKeys.user.me,
        queryFn: () => fetchUserProfileWithAccessToken(data.accessToken),
      });
    },
  });
}

export function useCompleteTutorialMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: TutorialRegistrationBody) => postTutorialRegistration(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}
