import type {
  TutorialAllergyItem,
  TutorialBloodType,
  TutorialRegistrationBody,
  TutorialRhType,
} from "@/api/types/tutorial";
import type { UserProfile } from "@/api/types/user";
import type { User } from "@/stores/userStore";
import { splitBloodTypeWithRh } from "@/utils/blood-type";

const MEDICINE_ALLERGY_OPTIONS = ["페니실린", "아스피린", "소염진통제", "설파제"] as const;
const FOOD_ALLERGY_OPTIONS = ["땅콩", "해산물", "유제품", "계란"] as const;

/** UI 선택지·한글 라벨 → ATC 코드 (PATCH /users/me 등 레거시 경로) */
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

/** 튜토리얼 POST용 약물 알러지 → ATC_GROUP */
const MEDICINE_ALLERGY_TO_TUTORIAL: Record<
  (typeof MEDICINE_ALLERGY_OPTIONS)[number],
  Pick<TutorialAllergyItem, "type" | "value" | "name">
> = {
  페니실린: { type: "ATC_GROUP", value: "J01C", name: "페니실린" },
  아스피린: { type: "ATC_GROUP", value: "N02BA", name: "아스피린" },
  소염진통제: { type: "ATC_GROUP", value: "M01A", name: "소염진통제" },
  설파제: { type: "ATC_GROUP", value: "J01E", name: "설파제" },
};

/** 튜토리얼 POST용 기저질환 라벨 → ICD 코드 */
const CHRONIC_CONDITION_TO_DISEASE_CODE: Record<string, string> = {
  고혈압: "I10",
  당뇨병: "E11",
  천식: "J45",
  신장질환: "N18",
  간질환: "K76",
  심장질환: "I25",
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

const TUTORIAL_BLOOD_TYPES: readonly TutorialBloodType[] = ["A", "B", "O", "AB"];

function isMedicineAllergyLabel(label: string): label is (typeof MEDICINE_ALLERGY_OPTIONS)[number] {
  return MEDICINE_ALLERGY_OPTIONS.includes(label as (typeof MEDICINE_ALLERGY_OPTIONS)[number]);
}

function isFoodAllergyLabel(label: string): label is (typeof FOOD_ALLERGY_OPTIONS)[number] {
  return FOOD_ALLERGY_OPTIONS.includes(label as (typeof FOOD_ALLERGY_OPTIONS)[number]);
}

function toTutorialBloodType(value: string | undefined): TutorialBloodType | undefined {
  if (!value) return undefined;
  return TUTORIAL_BLOOD_TYPES.includes(value as TutorialBloodType)
    ? (value as TutorialBloodType)
    : undefined;
}

function toTutorialRhType(
  bloodType: User["bloodType"],
  rhFactor: ReturnType<typeof splitBloodTypeWithRh>["rhFactor"],
): TutorialRhType | undefined {
  if (rhFactor === "positive") return "PLUS";
  if (rhFactor === "negative") return "MINUS";
  if (bloodType?.endsWith("+")) return "PLUS";
  if (bloodType?.endsWith("-")) return "MINUS";
  return undefined;
}

export function profileAllergyLabelsToApiCodes(labels: string[]): string[] {
  const codes = new Set<string>();
  for (const label of labels) {
    const code = ALLERGY_LABEL_TO_ATC[label];
    codes.add(code ?? label);
  }
  return [...codes];
}

export function profileAllergyLabelsToTutorialItems(labels: string[]): TutorialAllergyItem[] {
  const items = new Map<string, TutorialAllergyItem>();

  for (const label of labels) {
    if (isMedicineAllergyLabel(label)) {
      const mapped = MEDICINE_ALLERGY_TO_TUTORIAL[label];
      items.set(`${mapped.type}:${mapped.value}`, mapped);
      continue;
    }

    if (isFoodAllergyLabel(label)) {
      const item: TutorialAllergyItem = { type: "FOOD", value: label, name: label };
      items.set(`${item.type}:${item.value}`, item);
      continue;
    }

    const item: TutorialAllergyItem = { type: "FOOD", value: label, name: label };
    items.set(`${item.type}:${item.value}`, item);
  }

  return [...items.values()];
}

export function chronicConditionLabelsToDiseaseCodes(labels: string[]): string[] {
  const codes = new Set<string>();
  for (const label of labels) {
    codes.add(CHRONIC_CONDITION_TO_DISEASE_CODE[label] ?? label);
  }
  return [...codes];
}

export function profileToUser(profile: UserProfile): User {
  const normalizedBloodType = profile.bloodType?.toUpperCase() ?? null;
  const supportedBloodType =
    normalizedBloodType &&
    SUPPORTED_BLOOD_TYPES.includes(normalizedBloodType as (typeof SUPPORTED_BLOOD_TYPES)[number])
      ? (normalizedBloodType as User["bloodType"])
      : null;

  const gender: User["gender"] =
    profile.gender === "M" ? "male" : profile.gender === "F" ? "female" : null;

  return {
    id: "me",
    displayName: profile.displayName,
    email: null,
    birthDate: profile.birthDate,
    height: profile.height,
    weight: profile.weight,
    gender,
    bloodType: supportedBloodType,
    allergies: (profile.allergies ?? []).map((a) => a.name),
    chronicConditions: profile.diseases ?? [],
    isTutorial: profile.isTutorialCompleted,
  };
}

export function userToTutorialRegistrationBody(user: User): TutorialRegistrationBody {
  if (!user.birthDate) {
    throw new Error("튜토리얼 등록에는 생년월일이 필요합니다.");
  }

  const { bloodType: baseBloodType, rhFactor } = splitBloodTypeWithRh(user.bloodType);
  const tutorialBloodType = toTutorialBloodType(baseBloodType);
  const tutorialRhType = toTutorialRhType(user.bloodType, rhFactor);

  return {
    birthDate: user.birthDate,
    gender: user.gender === "female" ? "FEMALE" : "MALE",
    height: user.height != null ? Math.round(user.height) : undefined,
    weight: user.weight != null ? Math.round(user.weight) : undefined,
    bloodType: tutorialBloodType,
    rhType: tutorialRhType ?? (tutorialBloodType ? "PLUS" : undefined),
    diseaseCodes: user.chronicConditions.length
      ? chronicConditionLabelsToDiseaseCodes(user.chronicConditions)
      : undefined,
    allergies: user.allergies.length
      ? profileAllergyLabelsToTutorialItems(user.allergies)
      : undefined,
  };
}
