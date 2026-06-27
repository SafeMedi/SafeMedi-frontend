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

/** PATCH /api/v1/users/me */
export type UpdateUserProfileBody = Partial<{
  displayName: string;
  gender: "M" | "F";
  bloodType: string;
  diseases: string[];
  allergies: string[];
  weight: number;
  height: number;
}>;
