import { birthDateToManAge, manAgeToBirthDate } from "@/utils/age";

const referenceDate = new Date("2026-06-27T12:00:00");

describe("age utils", () => {
  it("만 나이를 birthDate로 역산한다", () => {
    expect(manAgeToBirthDate(23, referenceDate)).toBe("2003-06-27");
  });

  it("birthDate에서 만 나이를 계산한다", () => {
    expect(birthDateToManAge("2003-06-27", referenceDate)).toBe(23);
    expect(birthDateToManAge("2003-06-28", referenceDate)).toBe(22);
  });

  it("잘못된 birthDate는 undefined를 반환한다", () => {
    expect(birthDateToManAge("invalid", referenceDate)).toBeUndefined();
  });
});
