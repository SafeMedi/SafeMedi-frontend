import { profileAllergyLabelsToApiCodes, userToTutorialRegistrationBody } from "@/utils/user-mapper";

const baseUser = {
  id: "me",
  displayName: "홍길동",
  email: null,
  birthDate: "1990-01-01",
  height: 170,
  weight: 65,
  gender: "female" as const,
  bloodType: "AB+" as const,
  allergies: ["페니실린", "해산물", "직접입력알러지", "페니실린"],
  chronicConditions: ["천식"],
  isTutorial: false,
};

describe("튜토리얼 사용자 매핑", () => {
  it("프로필 알러지 라벨을 중복 제거된 API 코드로 변환한다", () => {
    const mapped = profileAllergyLabelsToApiCodes([
      "페니실린",
      "해산물",
      "직접입력알러지",
      "페니실린",
    ]);

    expect(mapped).toEqual(expect.arrayContaining(["J01CA", "V01AA", "직접입력알러지"]));
    expect(mapped).toHaveLength(3);
  });

  it("백엔드가 기대하는 튜토리얼 요청 바디 형태로 변환한다", () => {
    const body = userToTutorialRegistrationBody(baseUser);

    expect(body).toEqual({
      birthDate: "1990-01-01",
      gender: "F",
      height: 170,
      weight: 65,
      bloodType: "AB",
      diseases: ["천식"],
      allergies: expect.arrayContaining(["J01CA", "V01AA", "직접입력알러지"]),
    });
  });

  it("질환/알러지가 없으면 선택 필드 배열을 생략한다", () => {
    const body = userToTutorialRegistrationBody({
      ...baseUser,
      allergies: [],
      chronicConditions: [],
      bloodType: null,
      gender: "male",
      birthDate: null,
      height: null,
      weight: null,
    });

    expect(body).toEqual({
      birthDate: "2000-01-01",
      gender: "M",
      height: undefined,
      weight: undefined,
      bloodType: undefined,
      diseases: undefined,
      allergies: undefined,
    });
  });
});
