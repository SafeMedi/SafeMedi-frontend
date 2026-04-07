/** 프로필·튜토리얼 등에서 공통으로 쓰는 혈액형 / 성별 선택지 */

export const BLOOD_TYPES = ["A", "B", "O", "AB"] as const;
export type BloodTypeOptionValue = (typeof BLOOD_TYPES)[number];

export const GENDERS = ["male", "female"] as const;
export type GenderOptionValue = (typeof GENDERS)[number];

export const bloodOptions: readonly { value: BloodTypeOptionValue; label: string }[] = [
  { value: "A", label: "A형" },
  { value: "B", label: "B형" },
  { value: "O", label: "O형" },
  { value: "AB", label: "AB형" },
];

export const genderOptions: readonly { value: GenderOptionValue; label: string }[] = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];
