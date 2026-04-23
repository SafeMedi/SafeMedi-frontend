import type { TutorialRegistrationBody } from "@/api/types/tutorial";
import type { UserProfile } from "@/api/types/user";
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

function mapAllergyLabelsToAtc(labels: string[]): string[] {
  const codes = new Set<string>();
  for (const label of labels) {
    const code = ALLERGY_LABEL_TO_ATC[label];
    if (code) codes.add(code);
  }
  return [...codes];
}

export function profileToUser(profile: UserProfile): User {
  return {
    id: "me",
    displayName: profile.displayName,
    email: null,
    birthDate: profile.birthDate,
    height: profile.height,
    weight: profile.weight,
    gender: profile.gender === "M" ? "male" : "female",
    bloodType:
      profile.bloodType === "A" ||
      profile.bloodType === "B" ||
      profile.bloodType === "O" ||
      profile.bloodType === "AB"
        ? profile.bloodType
        : null,
    allergies: profile.allergies.map((a) => a.name),
    chronicConditions: profile.diseases,
    isTutorial: profile.isTutorialCompleted,
  };
}

export function userToTutorialRegistrationBody(user: User): TutorialRegistrationBody {
  return {
    birthDate: user.birthDate ?? "2000-01-01",
    gender: user.gender === "female" ? "F" : "M",
    height: user.height ?? undefined,
    weight: user.weight ?? undefined,
    bloodType: user.bloodType ?? undefined,
    diseases: user.chronicConditions.length ? user.chronicConditions : undefined,
    allergies: user.allergies.length ? mapAllergyLabelsToAtc(user.allergies) : undefined,
  };
}
