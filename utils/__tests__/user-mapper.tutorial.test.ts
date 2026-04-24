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

describe("tutorial user mapping", () => {
  it("maps profile allergy labels into deduplicated api codes", () => {
    const mapped = profileAllergyLabelsToApiCodes([
      "페니실린",
      "해산물",
      "직접입력알러지",
      "페니실린",
    ]);

    expect(mapped).toEqual(expect.arrayContaining(["J01CA", "V01AA", "직접입력알러지"]));
    expect(mapped).toHaveLength(3);
  });

  it("converts tutorial body fields expected by backend", () => {
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

  it("omits optional arrays when user has no disease/allergy", () => {
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
