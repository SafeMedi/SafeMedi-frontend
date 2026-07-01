import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchDailyMedicationRecords,
  fetchMedicationHistoryRecords,
  fetchMedicationStatistics,
  fetchMonthlyMedicationRecords,
  fetchTodayMedicationSchedules,
  updateMedicationRecord,
} from "@/api/endpoints/dashboard";
import { applyOptimisticMedicationRecordsUpdate } from "@/api/queries/optimisticTodayMedicationSchedules";
import { queryKeys } from "@/api/query-keys";
import type {
  TodayMedicationSchedulesResponse,
  UpdateMedicationRecordRequest,
} from "@/api/types/dashboard";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 60 * 1000;

interface UseDashboardMedicationRecordsParams {
  readonly date: string;
}

export function useDashboardDailyMedicationRecords(params: UseDashboardMedicationRecordsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: queryKeys.dashboard.dailyMedicationRecords(params.date),
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: () => fetchDailyMedicationRecords({ date: params.date }),
  });
}

export function useDashboardTodayMedicationSchedules() {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: queryKeys.dashboard.todayMedicationSchedules,
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: fetchTodayMedicationSchedules,
  });
}

interface UpdateMedicationRecordMutationParams {
  readonly recordId: number;
  readonly body: UpdateMedicationRecordRequest;
}

interface MarkMedicationRecordsMutationParams {
  readonly recordIds: readonly number[];
  readonly body: UpdateMedicationRecordRequest;
}

interface MarkMedicationRecordsMutationContext {
  readonly previousData: TodayMedicationSchedulesResponse | undefined;
}

export function useUpdateMedicationRecordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, body }: UpdateMedicationRecordMutationParams) =>
      updateMedicationRecord(recordId, body),
    onMutate: async ({ recordId, body }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });

      const previousData = queryClient.getQueryData<TodayMedicationSchedulesResponse>(
        queryKeys.dashboard.todayMedicationSchedules,
      );

      if (previousData) {
        queryClient.setQueryData(
          queryKeys.dashboard.todayMedicationSchedules,
          applyOptimisticMedicationRecordsUpdate(previousData, [recordId], body),
        );
      }

      return { previousData } satisfies MarkMedicationRecordsMutationContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.dashboard.todayMedicationSchedules,
          context.previousData,
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });
    },
  });
}

export function useMarkMedicationRecordsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordIds, body }: MarkMedicationRecordsMutationParams) => {
      const results = await Promise.allSettled(
        recordIds.map((recordId) => updateMedicationRecord(recordId, body)),
      );

      const isAllRejected = results.every((result) => result.status === "rejected");
      if (isAllRejected) {
        const firstRejected = results.find((result) => result.status === "rejected");
        throw firstRejected?.reason ?? new Error("복약 완료 처리에 실패했습니다.");
      }

      return results;
    },
    onMutate: async ({ recordIds, body }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });

      const previousData = queryClient.getQueryData<TodayMedicationSchedulesResponse>(
        queryKeys.dashboard.todayMedicationSchedules,
      );

      if (previousData) {
        queryClient.setQueryData(
          queryKeys.dashboard.todayMedicationSchedules,
          applyOptimisticMedicationRecordsUpdate(previousData, recordIds, body),
        );
      }

      return { previousData } satisfies MarkMedicationRecordsMutationContext;
    },
    onSuccess: (results, variables, context) => {
      if (!context?.previousData) {
        return;
      }

      const successfulRecordIds = variables.recordIds.filter(
        (_, index) => results[index]?.status === "fulfilled",
      );
      const hasPartialFailure = successfulRecordIds.length < variables.recordIds.length;

      if (!hasPartialFailure) {
        return;
      }

      const reconciledData = applyOptimisticMedicationRecordsUpdate(
        context.previousData,
        successfulRecordIds,
        variables.body,
      );

      queryClient.setQueryData(queryKeys.dashboard.todayMedicationSchedules, reconciledData);
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.dashboard.todayMedicationSchedules,
          context.previousData,
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.todayMedicationSchedules,
      });
    },
  });
}

export function useDashboardMonthlyMedicationRecords(params: UseDashboardMedicationRecordsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: queryKeys.dashboard.monthlyMedicationRecords(params.date),
    enabled: !!accessToken,
    staleTime: STALE_MS,
    queryFn: () => fetchMonthlyMedicationRecords({ date: params.date }),
  });
}

export function useDashboardMedicationHistoryRecords(params: UseDashboardMedicationRecordsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);

  return useQuery({
    queryKey: queryKeys.dashboard.medicationHistoryRecords(params.date),
    enabled: !!accessToken && params.date.length > 0,
    staleTime: STALE_MS,
    queryFn: () => fetchMedicationHistoryRecords({ date: params.date }),
  });
}

interface UseMedicationStatisticsParams {
  readonly startDate: string;
  readonly endDate: string;
  readonly enabled?: boolean;
}

export function useMedicationStatistics(params: UseMedicationStatisticsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);
  const isEnabled =
    params.enabled !== false &&
    !!accessToken &&
    params.startDate.length > 0 &&
    params.endDate.length > 0;

  return useQuery({
    queryKey: queryKeys.dashboard.medicationStatistics(params.startDate, params.endDate),
    enabled: isEnabled,
    staleTime: STALE_MS,
    queryFn: () =>
      fetchMedicationStatistics({ startDate: params.startDate, endDate: params.endDate }),
  });
}
