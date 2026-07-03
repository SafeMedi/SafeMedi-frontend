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

export type RepresentativeAllergyOption = {
  readonly label: string;
  readonly type: "ATC_GROUP" | "INGREDIENT" | "FOOD";
  readonly value: string;
  readonly name: string;
};

export const representativeMedicineAllergyOptions = [
  { label: "페니실린", type: "ATC_GROUP", value: "J01CA04", name: "페니실린계 항생제" },
  { label: "아세트아미노펜", type: "INGREDIENT", value: "M040353", name: "아세트아미노펜" },
  { label: "나프록센 진통제", type: "INGREDIENT", value: "M050116", name: "나프록센 진통제" },
  { label: "페니라민", type: "ATC_GROUP", value: "R06AB04", name: "페니라민 항생제" },
] as const satisfies readonly RepresentativeAllergyOption[];

export const representativeFoodAllergyOptions = [
  { label: "땅콩", type: "FOOD", value: "땅콩", name: "땅콩" },
  { label: "해산물", type: "FOOD", value: "해산물", name: "해산물" },
  { label: "유제품", type: "FOOD", value: "유제품", name: "유제품" },
  { label: "계란", type: "FOOD", value: "계란", name: "계란" },
] as const satisfies readonly RepresentativeAllergyOption[];

export const profileEditQuickItems = {
  allergy: ["페니실린", "아세트아미노펜", "나프록센 진통제", "페니라민"],
  chronic: ["고혈압", "당뇨병", "천식", "신장질환", "간질환", "심장질환"],
} as const;
