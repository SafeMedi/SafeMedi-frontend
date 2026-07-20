import {
  hasOnlyPlaceholderMedications,
  parsePrescriptionFromJson,
  parsePrescriptionFromOcrText,
} from "../ocr-parser";

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

  it("병원·환자 등 관리 정보 줄은 약물 후보에서 제외한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      서울가정의학과 처방전
      환자 홍길동
      약국 조제
      2026.05.13 ~ 2026.05.20
      타이레놀정 500mg
    `);

    expect(draft.medications).toEqual([{ atcCode: "UNKNOWN", drugName: "타이레놀정 500mg" }]);
  });

  it("중복된 약물 줄은 하나로 합친다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      타이레놀정 500mg
      타이레놀정 500mg
      2026.05.13 ~ 2026.05.20
    `);

    expect(draft.medications).toEqual([{ atcCode: "UNKNOWN", drugName: "타이레놀정 500mg" }]);
  });

  it("약물 후보를 찾지 못하면 미확인 약물로 대체하고 저신뢰 결과로 판별된다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      2026.05.13 ~ 2026.05.20
      다음 방문일에 다시 오세요
    `);

    expect(draft.medications).toEqual([{ atcCode: "UNKNOWN", drugName: "미확인 약물" }]);
    expect(hasOnlyPlaceholderMedications(draft.medications)).toBe(true);
  });

  it("정상적으로 약물을 찾으면 저신뢰 결과가 아니다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      타이레놀정 500mg
      2026.05.13 ~ 2026.05.20
    `);

    expect(hasOnlyPlaceholderMedications(draft.medications)).toBe(false);
  });

  it("날짜만 있는 줄은 제목 후보에서 제외한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      2026.05.13 ~ 2026.05.20
      서울가정의학과 처방전
      타이레놀정 500mg
    `);

    expect(draft.title).toBe("서울가정의학과 처방전");
  });
});
