/** GET /api/v1/users/me 등에 쓰이는 알러지 항목 (코드 + 한글명) */
export type AllergyItem = {
  code: string;
  name: string;
};

/** GET /api/v1/users/me 응답 (SAF-26). 소셜 로그인 직후·튜토리얼 전에는 null 필드가 올 수 있습니다. */
export type UserProfile = {
  displayName: string | null;
  birthDate: string | null;
  gender: "M" | "F" | null;
  height: number | null;
  weight: number | null;
  bloodType: string | null;
  diseases: string[] | null;
  allergies: AllergyItem[] | null;
  isTutorialCompleted: boolean;
};

export type UserProfilePatchGender = "MALE" | "FEMALE";

export type UserProfilePatchBloodType = "A" | "B" | "O" | "AB";

export type UserProfilePatchRhType = "PLUS" | "MINUS";

export type UserProfilePatchAllergyItem = {
  type: "ATC_GROUP" | "INGREDIENT" | "CUSTOM";
  value: string;
  name: string;
};

/** PATCH /api/v1/users/me */
export type UpdateUserProfileBody = Partial<{
  nickname: string;
  gender: UserProfilePatchGender;
  bloodType: UserProfilePatchBloodType;
  rhType: UserProfilePatchRhType;
  diseaseCodes: string[];
  allergies: UserProfilePatchAllergyItem[];
  weight: number;
  height: number;
}>;
