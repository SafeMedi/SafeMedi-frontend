import { FAMILY_AVATAR_GRADIENTS } from "./constants";

export type FamilyProfile = {
  id: string;
  name: string;
  isActive: boolean;
  avatarGradient: readonly [string, string];
};

export const MOCK_USER = {
  name: "홍길동",
  role: "주 사용자",
};

export const MOCK_FAMILY_PROFILES: readonly FamilyProfile[] = [
  { id: "self", name: "본인", isActive: true, avatarGradient: FAMILY_AVATAR_GRADIENTS.green },
  { id: "mother", name: "어머니", isActive: false, avatarGradient: FAMILY_AVATAR_GRADIENTS.purple },
  { id: "father", name: "아버지", isActive: false, avatarGradient: FAMILY_AVATAR_GRADIENTS.purple },
];

export const MOCK_ALLERGIES = ["페니실린", "아스피린"];
export const MOCK_CHRONIC_CONDITIONS = ["고혈압", "당뇨병"];

export const APP_VERSION = "v1.0.0";
