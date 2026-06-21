import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  DeletePrescriptionResponse,
  PrescriptionsListResponse,
  UpdatePrescriptionRequest,
  UpdatePrescriptionResponse,
} from "@/api/types/prescriptions";

export async function fetchPrescriptions(): Promise<PrescriptionsListResponse> {
  return api.get(apiPaths.prescriptions).json<PrescriptionsListResponse>();
}

export async function updatePrescription(
  prescriptionId: number,
  body: UpdatePrescriptionRequest,
): Promise<UpdatePrescriptionResponse> {
  return api
    .patch(apiPaths.prescription(prescriptionId), { json: body })
    .json<UpdatePrescriptionResponse>();
}

export async function deletePrescription(
  prescriptionId: number,
): Promise<DeletePrescriptionResponse> {
  return api.delete(apiPaths.prescription(prescriptionId)).json<DeletePrescriptionResponse>();
}
