import type { TutorialRegistrationBody } from "@/api/types/tutorial";
import type { UserProfile } from "@/api/types/user";
import { BLOOD_TYPES } from "@/constants/health-profile-options";
import type { User } from "@/stores/userStore";

/** UI 선택지·한글 라벨 → ATC 코드 (백엔드 연동 전 임시 매핑) */
const ALLERGY_LABEL_TO_ATC: Record<string, string> = {
  페니실린: "J01CA",
  아스피린: "N02BA01",
  소염진통제: "M01A",
  설파제: "J01E",
  땅콩: "V01AA",
  해산물: "V01AA",
  유제품: "V01AA",
  계란: "V01AA",
};

const SUPPORTED_BLOOD_TYPES = [
  "A",
  "B",
  "O",
  "AB",
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
] as const;

export function profileAllergyLabelsToApiCodes(labels: string[]): string[] {
  const codes = new Set<string>();
  for (const label of labels) {
    const code = ALLERGY_LABEL_TO_ATC[label];
    codes.add(code ?? label);
  }
  return [...codes];
}

export function profileToUser(profile: UserProfile): User {
  const bloodType = profile.bloodType.toUpperCase();
  const supportedBloodType = SUPPORTED_BLOOD_TYPES.includes(
    bloodType as (typeof SUPPORTED_BLOOD_TYPES)[number],
  )
    ? (bloodType as User["bloodType"])
    : null;

  return {
    id: "me",
    displayName: profile.displayName,
    email: null,
    birthDate: profile.birthDate,
    height: profile.height,
    weight: profile.weight,
    gender: profile.gender === "M" ? "male" : "female",
    bloodType: supportedBloodType,
    allergies: profile.allergies.map((a) => a.name),
    chronicConditions: profile.diseases,
    isTutorial: profile.isTutorialCompleted,
  };
}

export function userToTutorialRegistrationBody(user: User): TutorialRegistrationBody {
  const baseBloodType =
    user.bloodType?.replace("+", "").replace("-", "") as (typeof BLOOD_TYPES)[number] | undefined;

  return {
    birthDate: user.birthDate ?? "2000-01-01",
    gender: user.gender === "female" ? "F" : "M",
    height: user.height ?? undefined,
    weight: user.weight ?? undefined,
    bloodType: baseBloodType && BLOOD_TYPES.includes(baseBloodType) ? baseBloodType : undefined,
    diseases: user.chronicConditions.length ? user.chronicConditions : undefined,
    allergies: user.allergies.length ? profileAllergyLabelsToApiCodes(user.allergies) : undefined,
  };
}
