import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptFamilyInvitation,
  createFamilyInvitation,
  deleteFamily,
  fetchFamilies,
  fetchFamilyInvitation,
  updateFamilyRelation,
} from "@/api/endpoints/family";
import { queryKeys } from "@/api/query-keys";
import type { FamilySummary, UpdateFamilyRelationBody } from "@/api/types/family";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 5 * 60 * 1000;

export function useFamilies() {
  const accessToken = useSessionStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.family.list,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: fetchFamilies,
  });
}

export function useCreateFamilyInvitation() {
  return useMutation({
    mutationFn: createFamilyInvitation,
  });
}

export function useFamilyInvitation(token: string | null) {
  const accessToken = useSessionStore((s) => s.accessToken);

  return useQuery({
    queryKey: queryKeys.family.invitation(token ?? ""),
    enabled: !!accessToken && !!token,
    staleTime: STALE_MS,
    queryFn: async () => {
      if (!token) {
        throw new Error("초대 토큰이 필요합니다.");
      }
      return fetchFamilyInvitation(token);
    },
  });
}

export function useAcceptFamilyInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptFamilyInvitation,
    onSuccess: async (accepted) => {
      queryClient.setQueryData<FamilySummary[]>(queryKeys.family.list, (current) => {
        if (!current) {
          return current;
        }
        const withoutDuplicate = current.filter((family) => family.familyId !== accepted.familyId);
        return [
          ...withoutDuplicate,
          {
            familyId: accepted.familyId,
            name: accepted.name,
            relation: accepted.relation,
          },
        ];
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.family.list });
    },
  });
}

export function useUpdateFamilyRelation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, body }: { familyId: number; body: UpdateFamilyRelationBody }) =>
      updateFamilyRelation(familyId, body),
    onSuccess: async (updated) => {
      queryClient.setQueryData<FamilySummary[]>(queryKeys.family.list, (current) => {
        if (!current) {
          return current;
        }
        return current.map((family) =>
          family.familyId === updated.familyId
            ? { ...family, name: updated.name, relation: updated.relation }
            : family,
        );
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.family.list });
    },
  });
}

export function useDeleteFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFamily,
    onSuccess: async (_result, familyId) => {
      queryClient.setQueryData<FamilySummary[]>(queryKeys.family.list, (current) =>
        current?.filter((family) => family.familyId !== familyId),
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.family.list });
    },
  });
}
