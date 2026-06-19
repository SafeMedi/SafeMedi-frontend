import { parsePrescriptionFromJson, parsePrescriptionFromOcrText } from "../ocr-parser";

describe("ocr-parser", () => {
  it("OCR 텍스트에서 처방전 draft를 추출한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      서울가정의학과 처방전
      2026.05.13 ~ 2026.05.20
      타이레놀정 500mg
      아목시실린캡슐 250mg
      복용시간 09:00 21:00
    `);

    expect(draft.title).toBe("서울가정의학과 처방전");
    expect(draft.startDate).toBe("2026-05-13");
    expect(draft.endDate).toBe("2026-05-20");
    expect(draft.medications.length).toBeGreaterThan(0);
  });

  it("직접 입력 JSON을 검증하여 draft로 변환한다", () => {
    const draft = parsePrescriptionFromJson(`{
      "title": "직접 입력 처방전",
      "startDate": "2026-05-13",
      "endDate": "2026-05-20",
      "medications": [{ "atcCode": "UNKNOWN", "drugName": "타이레놀정 500mg" }],
      "rawText": "manual"
    }`);

    expect(draft.title).toBe("직접 입력 처방전");
    expect(draft.medications[0]?.drugName).toBe("타이레놀정 500mg");
  });

  it("직접 입력 JSON에서 title은 빈 문자열을 허용한다", () => {
    const draft = parsePrescriptionFromJson(`{
      "title": "",
      "startDate": "2026-05-13",
      "endDate": "2026-05-20",
      "medications": [{ "atcCode": "UNKNOWN", "drugName": "타이레놀정 500mg" }],
      "rawText": "manual"
    }`);

    expect(draft.title).toBe("");
  });

  it("빈 OCR 텍스트면 에러를 발생시킨다", () => {
    expect(() => parsePrescriptionFromOcrText(" ")).toThrow(
      "OCR 결과가 비어 있습니다. 이미지가 선명한지 확인해 주세요.",
    );
  });
});
