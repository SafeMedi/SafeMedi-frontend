import { formatDateLabel, formatDateToIso, parseIsoDate } from "../date";

describe("utils/date", () => {
  it("formatDateToIso는 YYYY-MM-DD 형식 문자열을 반환한다", () => {
    const date = new Date(2026, 4, 3);

    expect(formatDateToIso(date)).toBe("2026-05-03");
  });

  it("parseIsoDate는 유효한 ISO 날짜 문자열을 Date로 변환한다", () => {
    const result = parseIsoDate("2026-05-03");

    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(4);
    expect(result?.getDate()).toBe(3);
  });

  it("parseIsoDate는 유효하지 않은 날짜 문자열이면 null을 반환한다", () => {
    expect(parseIsoDate("2026/05/03")).toBeNull();
    expect(parseIsoDate("2026-02-30")).toBeNull();
  });

  it("formatDateLabel은 유효하지 않은 입력이면 기본 안내 문구를 반환한다", () => {
    expect(formatDateLabel("")).toBe("날짜를 선택해주세요");
  });
});
