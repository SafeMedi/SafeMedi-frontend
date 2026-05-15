import { useMutation } from "@tanstack/react-query";
import { createPrescriptionByScan } from "@/api/endpoints/prescription-scan";
import { queryKeys } from "@/api/query-keys";
import type { CreatePrescriptionRequest } from "@/api/types";

export function useCreatePrescriptionByScanMutation() {
  return useMutation({
    mutationKey: queryKeys.scan.createPrescription,
    mutationFn: (body: CreatePrescriptionRequest) => createPrescriptionByScan(body),
  });
}
