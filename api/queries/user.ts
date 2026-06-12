import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postSocialLogin } from "@/api/endpoints/auth";
import { postTutorialRegistration } from "@/api/endpoints/tutorial";
import {
  fetchUserProfile,
  fetchUserProfileWithAccessToken,
  patchUserProfile,
} from "@/api/endpoints/user";
import { queryKeys } from "@/api/query-keys";
import type { TutorialRegistrationBody } from "@/api/types/tutorial";
import type { UserProfile } from "@/api/types/user";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";
import { profileToUser } from "@/utils/user-mapper";

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
  const setTutorialCompleted = useSessionStore((s) => s.setTutorialCompleted);

  return useMutation({
    mutationFn: async ({
      provider,
      accessToken,
    }: {
      provider: "kakao" | "naver";
      accessToken: string;
    }) => {
      const loginResponse = await postSocialLogin(provider, accessToken);
      if (!loginResponse?.accessToken) {
        throw new Error("로그인 응답에 accessToken이 없습니다.");
      }

      const profile = await fetchUserProfileWithAccessToken(loginResponse.accessToken);
      return {
        accessToken: loginResponse.accessToken,
        isTutorialCompleted: loginResponse.isTutorialCompleted,
        profile,
      };
    },
    onSuccess: ({ accessToken, isTutorialCompleted, profile }) => {
      setAccessToken(accessToken);
      setTutorialCompleted(isTutorialCompleted);
      queryClient.setQueryData(queryKeys.user.me, profile);
      useUserStore.getState().setUser(profileToUser(profile));
    },
  });
}

export function useCompleteTutorialMutation() {
  const queryClient = useQueryClient();
  const setTutorialCompleted = useSessionStore((s) => s.setTutorialCompleted);

  return useMutation({
    mutationFn: (body: TutorialRegistrationBody) => postTutorialRegistration(body),
    onSuccess: async () => {
      setTutorialCompleted(true);
      queryClient.setQueryData<UserProfile | undefined>(queryKeys.user.me, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isTutorialCompleted: true,
        };
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchUserProfile,
    onSuccess: async (updatedProfile) => {
      queryClient.setQueryData(queryKeys.user.me, updatedProfile);
      useUserStore.getState().setUser(profileToUser(updatedProfile));
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}
