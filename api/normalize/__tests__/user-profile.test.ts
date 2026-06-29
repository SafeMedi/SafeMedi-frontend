import { normalizeUserProfile } from "@/api/normalize/user-profile";

describe("normalizeUserProfile", () => {
  it("nickname·분리 rhType 응답을 UserProfile로 정규화한다", () => {
    expect(
      normalizeUserProfile({
        nickname: "카카오유저",
        birthDate: null,
        gender: "MALE",
        height: null,
        weight: null,
        bloodType: "O",
        rhType: "PLUS",
        diseases: [],
        allergies: [],
        isTutorialCompleted: false,
      }),
    ).toEqual({
      displayName: "카카오유저",
      birthDate: null,
      gender: "M",
      height: null,
      weight: null,
      bloodType: "O+",
      diseases: [],
      allergies: [],
      isTutorialCompleted: false,
    });
  });
});
