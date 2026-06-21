import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  DeletePrescriptionResponse,
  PrescriptionsListResponse,
  UpdatePrescriptionRequest,
  UpdatePrescriptionResponse,
} from "@/api/types/prescriptions";

export const PRESCRIPTIONS_FALLBACK_MOCKS: PrescriptionsListResponse = {
  prescriptions: [
    {
      prescriptionId: 11,
      title: "신장내과 처방전",
      medications: [
        {
          medicationId: 101,
          atcCode: "N02BE01",
          drugName: "타이레놀정 500mg",
          takeTimes: ["08:00", "18:00", "22:00"],
          mainIngredient: "아세트아미노펜",
          hasWarning: false,
        },
        {
          medicationId: 102,
          atcCode: "A02BC01",
          drugName: "오메프라졸캡슐 20mg",
          takeTimes: ["08:00"],
          mainIngredient: "오메프라졸",
          hasWarning: false,
        },
      ],
    },
    {
      prescriptionId: 12,
      title: "심장내과 처방전",
      medications: [
        {
          medicationId: 201,
          atcCode: "C08CA01",
          drugName: "암로디핀정 5mg",
          takeTimes: ["14:00"],
          mainIngredient: "암로디핀베실산염",
          hasWarning: true,
          warningMessage: "이 약물은 주의가 필요합니다. 의사와 상담 후 복용하세요.",
        },
      ],
    },
  ],
};

function resolvePrescriptionsFallback(): PrescriptionsListResponse {
  return PRESCRIPTIONS_FALLBACK_MOCKS;
}

export async function fetchPrescriptions(): Promise<PrescriptionsListResponse> {
  try {
    return await api.get(apiPaths.prescriptions).json<PrescriptionsListResponse>();
  } catch {
    return resolvePrescriptionsFallback();
  }
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
