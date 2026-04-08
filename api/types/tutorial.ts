/** POST /api/v1/users/me/tutorial */
export type TutorialRegistrationBody = {
  birthDate: string;
  gender: "M" | "F";
  height?: number;
  weight?: number;
  bloodType?: string;
  diseases?: string[];
  /** ATC 코드 배열 (SAF-26) */
  allergies?: string[];
};

export type TutorialRegistrationResponse = {
  message: string;
  isTutorialCompleted: boolean;
};
