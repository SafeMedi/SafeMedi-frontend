import {
  chronicConditionLabelsToDiseaseCodes,
  profileAllergyLabelsToApiCodes,
  profileAllergyLabelsToTutorialItems,
  profileToUser,
  userToTutorialRegistrationBody,
} from "@/utils/user-mapper";

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
  it("소셜 로그인 직후 null 프로필 필드를 안전하게 User로 변환한다", () => {
    const user = profileToUser({
      displayName: "카카오유저",
      birthDate: null,
      gender: null,
      height: null,
      weight: null,
      bloodType: null,
      diseases: null,
      allergies: null,
      isTutorialCompleted: false,
    });

    expect(user).toEqual({
      id: "me",
      displayName: "카카오유저",
      email: null,
      birthDate: null,
      height: null,
      weight: null,
      gender: null,
      bloodType: null,
      allergies: [],
      chronicConditions: [],
      isTutorial: false,
    });
  });

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

  it("튜토리얼 알러지 라벨을 type/value/name 객체 배열로 변환한다", () => {
    const mapped = profileAllergyLabelsToTutorialItems([
      "페니실린",
      "해산물",
      "직접입력알러지",
      "페니실린",
    ]);

    expect(mapped).toEqual(
      expect.arrayContaining([
        { type: "ATC_GROUP", value: "J01C", name: "페니실린" },
        { type: "FOOD", value: "해산물", name: "해산물" },
        { type: "FOOD", value: "직접입력알러지", name: "직접입력알러지" },
      ]),
    );
    expect(mapped).toHaveLength(3);
  });

  it("기저질환 라벨을 diseaseCodes로 변환한다", () => {
    expect(chronicConditionLabelsToDiseaseCodes(["고혈압", "당뇨병", "직접입력"])).toEqual([
      "I10",
      "E11",
      "직접입력",
    ]);
  });

  it("백엔드가 기대하는 튜토리얼 요청 바디 형태로 변환한다", () => {
    const body = userToTutorialRegistrationBody(baseUser);

    expect(body).toEqual({
      birthDate: "1990-01-01",
      gender: "FEMALE",
      height: 170,
      weight: 65,
      bloodType: "AB",
      rhType: "PLUS",
      diseaseCodes: ["J45"],
      allergies: expect.arrayContaining([
        { type: "ATC_GROUP", value: "J01C", name: "페니실린" },
        { type: "FOOD", value: "해산물", name: "해산물" },
        { type: "FOOD", value: "직접입력알러지", name: "직접입력알러지" },
      ]),
    });
  });

  it("질환/알러지가 없으면 선택 필드 배열을 생략한다", () => {
    const body = userToTutorialRegistrationBody({
      ...baseUser,
      allergies: [],
      chronicConditions: [],
      bloodType: null,
      gender: "male",
      birthDate: "1990-01-01",
      height: null,
      weight: null,
    });

    expect(body).toEqual({
      birthDate: "1990-01-01",
      gender: "MALE",
      height: undefined,
      weight: undefined,
      bloodType: undefined,
      rhType: undefined,
      diseaseCodes: undefined,
      allergies: undefined,
    });
  });

  it("Rh 정보가 없는 혈액형은 rhType을 추정하지 않는다", () => {
    const body = userToTutorialRegistrationBody({
      ...baseUser,
      bloodType: "AB",
    });

    expect(body.bloodType).toBe("AB");
    expect(body.rhType).toBeUndefined();
  });

  it("생년월일이 없으면 요청 바디 변환에 실패한다", () => {
    expect(() =>
      userToTutorialRegistrationBody({
        ...baseUser,
        birthDate: null,
      }),
    ).toThrow("튜토리얼 등록에는 생년월일이 필요합니다.");
  });
});
