import type {
  TutorialAllergyItem,
  TutorialBloodType,
  TutorialRegistrationBody,
  TutorialRhType,
} from "@/api/types/tutorial";
import type { UserProfile, UserProfilePatchAllergyItem } from "@/api/types/user";
import {
  chronicConditionOptions,
  type RepresentativeAllergyOption,
  representativeFoodAllergyOptions,
  representativeMedicineAllergyOptions,
} from "@/constants/health-profile-options";
import type { User } from "@/stores/userStore";
import { splitBloodTypeWithRh } from "@/utils/blood-type";

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

function findRepresentativeMedicineAllergy(label: string): RepresentativeAllergyOption | undefined {
  return representativeMedicineAllergyOptions.find((option) => option.label === label);
}

function findRepresentativeFoodAllergy(label: string): RepresentativeAllergyOption | undefined {
  return representativeFoodAllergyOptions.find((option) => option.label === label);
}

function findChronicCondition(label: string) {
  return chronicConditionOptions.find((option) => option.label === label);
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
    const representative =
      findRepresentativeMedicineAllergy(label) ?? findRepresentativeFoodAllergy(label);
    if (representative) {
      codes.add(representative.value);
    }
  }
  return [...codes];
}

export function profileAllergyLabelsToPatchItems(
  labels: string[],
  mappedItems: Readonly<Record<string, UserProfilePatchAllergyItem>> = {},
): UserProfilePatchAllergyItem[] {
  const items = new Map<string, UserProfilePatchAllergyItem>();

  for (const label of labels) {
    const selectedItem = mappedItems[label];
    if (selectedItem) {
      items.set(`${selectedItem.type}:${selectedItem.value}`, selectedItem);
      continue;
    }

    const mapped = findRepresentativeMedicineAllergy(label) ?? findRepresentativeFoodAllergy(label);
    if (mapped) {
      const item: UserProfilePatchAllergyItem = {
        type: mapped.type,
        value: mapped.value,
        name: mapped.name,
      };
      items.set(`${item.type}:${item.value}`, item);
    }
  }

  return [...items.values()];
}

export function profileAllergyLabelsToTutorialItems(
  labels: string[],
  mappedItems: Readonly<Record<string, TutorialAllergyItem>> = {},
): TutorialAllergyItem[] {
  const items = new Map<string, TutorialAllergyItem>();

  for (const label of labels) {
    const selectedItem = mappedItems[label];
    if (selectedItem) {
      items.set(`${selectedItem.type}:${selectedItem.value}`, selectedItem);
      continue;
    }

    const medicine = findRepresentativeMedicineAllergy(label);
    if (medicine) {
      const item: TutorialAllergyItem = {
        type: medicine.type,
        value: medicine.value,
        name: medicine.name,
      };
      items.set(`${item.type}:${item.value}`, item);
      continue;
    }

    const food = findRepresentativeFoodAllergy(label);
    if (food) {
      const item: TutorialAllergyItem = {
        type: food.type,
        value: food.value,
        name: food.name,
      };
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
    const option = findChronicCondition(label);
    if (option) {
      codes.add(option.code);
    }
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
  const diseaseCodes = chronicConditionLabelsToDiseaseCodes(user.chronicConditions);

  return {
    birthDate: user.birthDate,
    gender: user.gender === "female" ? "FEMALE" : "MALE",
    height: user.height != null ? Math.round(user.height) : undefined,
    weight: user.weight != null ? Math.round(user.weight) : undefined,
    bloodType: tutorialBloodType,
    rhType: tutorialRhType,
    diseaseCodes: diseaseCodes.length ? diseaseCodes : undefined,
    allergies: user.allergies.length
      ? profileAllergyLabelsToTutorialItems(user.allergies, user.allergyMappings)
      : undefined,
  };
}
