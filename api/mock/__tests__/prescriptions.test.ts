import { registerSaf26Mocks } from "@/api/mock/handlers";
import { MockRegistry } from "@/api/mock/registry";
import { mockState } from "@/api/mock/state";
import type { PrescriptionListItem } from "@/api/types";

function clonePrescriptions(
  prescriptions: readonly PrescriptionListItem[],
): PrescriptionListItem[] {
  return prescriptions.map((prescription) => ({
    ...prescription,
    medications: prescription.medications.map((medication) => ({
      ...medication,
      takeTimes: [...medication.takeTimes],
    })),
  }));
}

describe("처방전 mock", () => {
  const initialPrescriptions = clonePrescriptions(mockState.prescriptions);
  const initialMedicationIdSeq = mockState.medicationIdSeq;

  beforeEach(() => {
    mockState.prescriptions = clonePrescriptions(initialPrescriptions);
    mockState.medicationIdSeq = initialMedicationIdSeq;
  });

  it("수정 및 삭제 결과를 다음 목록 조회에 반영한다", async () => {
    const registry = new MockRegistry();
    registerSaf26Mocks(registry);
    const context = {
      path: "/api/v1/prescriptions/11",
      searchParams: new URLSearchParams(),
    };
    const patchRoute = registry.find("PATCH", context.path);
    const deleteRoute = registry.find("DELETE", context.path);
    const getRoute = registry.find("GET", "/api/v1/prescriptions");

    if (!patchRoute || !deleteRoute || !getRoute) {
      throw new Error("처방전 mock route가 등록되지 않았습니다.");
    }

    await patchRoute.handler({
      ...context,
      method: "PATCH",
      jsonBody: {
        medications: [
          {
            atcCode: "N02BE01",
            drugName: "타이레놀정 650mg",
            takeTimes: ["08:00", "18:00", "22:00"],
          },
        ],
      },
    });

    const updated = await getRoute.handler({
      method: "GET",
      path: "/api/v1/prescriptions",
      searchParams: new URLSearchParams(),
      jsonBody: undefined,
    });
    expect(updated).toMatchObject({
      prescriptions: expect.arrayContaining([
        expect.objectContaining({
          prescriptionId: 11,
          medications: expect.arrayContaining([
            expect.objectContaining({ drugName: "타이레놀정 650mg" }),
          ]),
        }),
      ]),
    });

    await deleteRoute.handler({ ...context, method: "DELETE", jsonBody: undefined });

    const deleted = await getRoute.handler({
      method: "GET",
      path: "/api/v1/prescriptions",
      searchParams: new URLSearchParams(),
      jsonBody: undefined,
    });
    expect(deleted).toMatchObject({
      prescriptions: [expect.objectContaining({ prescriptionId: 12 })],
    });
  });
});
