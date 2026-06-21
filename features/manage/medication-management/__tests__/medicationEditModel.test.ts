import {
  buildUpdatedMedicationsAfterEdit,
  convertTakeSlotsToTimes,
  convertTakeTimesToTakeSlots,
  createMedicationEditDraft,
  isMedicationEditDraftSavable,
  toggleMedicationEditTakeSlot,
  validateMedicationEditDraft,
} from "../medicationEditModel";

describe("medicationEditModel", () => {
  const prescription = {
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
  } as const;

  it("복용 시간을 슬롯으로 변환한다", () => {
    expect(convertTakeTimesToTakeSlots(["08:00", "13:00", "19:00"])).toEqual([
      "MORNING",
      "LUNCH",
      "DINNER",
    ]);
    expect(convertTakeTimesToTakeSlots(["18:00", "22:00"])).toEqual(["DINNER"]);
  });

  it("슬롯을 복용 시간으로 변환한다", () => {
    expect(convertTakeSlotsToTimes(["MORNING", "DINNER"])).toEqual(["08:00", "19:00"]);
  });

  it("편집 draft를 생성하고 검증한다", () => {
    const draft = createMedicationEditDraft(prescription, 101);

    expect(draft).toEqual({
      drugName: "타이레놀정 500mg",
      atcCode: "N02BE01",
      takeSlots: ["MORNING", "DINNER"],
    });
    expect(isMedicationEditDraftSavable(draft)).toBe(true);
    if (!draft) {
      throw new Error("draft should exist");
    }
    expect(validateMedicationEditDraft({ ...draft, atcCode: "" }).isValid).toBe(false);
  });

  it("복약 시간 슬롯을 토글한다", () => {
    const draft = createMedicationEditDraft(prescription, 101);
    expect(draft).not.toBeNull();
    if (!draft) {
      throw new Error("draft should exist");
    }

    const withoutMorning = toggleMedicationEditTakeSlot(draft, "MORNING");
    expect(withoutMorning.takeSlots).toEqual(["DINNER"]);

    const withLunch = toggleMedicationEditTakeSlot(withoutMorning, "LUNCH");
    expect(withLunch.takeSlots).toEqual(["DINNER", "LUNCH"]);
  });

  it("약물 수정 PATCH body를 생성한다", () => {
    const draft = {
      drugName: "타이레놀정 650mg",
      atcCode: "N02BE01",
      takeSlots: ["MORNING", "LUNCH"] as const,
    };

    expect(buildUpdatedMedicationsAfterEdit(prescription, 101, draft)).toEqual([
      {
        atcCode: "N02BE01",
        drugName: "타이레놀정 650mg",
        takeTimes: ["08:00", "13:00"],
      },
      {
        atcCode: "A02BC01",
        drugName: "오메프라졸캡슐 20mg",
        takeTimes: ["08:00"],
      },
    ]);
  });
});
