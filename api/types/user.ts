/** GET /api/v1/users/me 등에 쓰이는 알러지 항목 (코드 + 한글명) */
export type AllergyItem = {
  code: string;
  name: string;
};

/** GET /api/v1/users/me 응답 (SAF-26) */
export type UserProfile = {
  displayName: string;
  birthDate: string;
  gender: "M" | "F";
  height: number;
  weight: number;
  bloodType: string;
  diseases: string[];
  allergies: AllergyItem[];
  isTutorialCompleted: boolean;
};
