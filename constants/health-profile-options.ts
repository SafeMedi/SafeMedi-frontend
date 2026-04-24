/** 프로필·튜토리얼 등에서 공통으로 쓰는 혈액형 / 성별 선택지 */

export const BLOOD_TYPES = ["A", "B", "O", "AB"] as const;
export type BloodTypeOptionValue = (typeof BLOOD_TYPES)[number];

export const RH_FACTORS = ["positive", "negative"] as const;
export type RhFactorOptionValue = (typeof RH_FACTORS)[number];

export const GENDERS = ["male", "female"] as const;
export type GenderOptionValue = (typeof GENDERS)[number];

export const bloodOptions: readonly { value: BloodTypeOptionValue; label: string }[] = [
  { value: "A", label: "A형" },
  { value: "B", label: "B형" },
  { value: "O", label: "O형" },
  { value: "AB", label: "AB형" },
];

export const rhOptions: readonly { value: RhFactorOptionValue; label: string }[] = [
  { value: "positive", label: "Rh+" },
  { value: "negative", label: "Rh-" },
];

export const genderOptions: readonly { value: GenderOptionValue; label: string }[] = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

export const profileEditQuickItems = {
  allergy: ["설파제", "세파계 항생제", "이부프로펜", "조영제"],
  chronic: ["고지혈증", "천식", "위염", "간질환", "신장질환"],
} as const;
