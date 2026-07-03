import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert } from "react-native";

import { useSearchDrugsQuery } from "@/api/queries/drugs";
import { useUpdateUserProfileMutation } from "@/api/queries/user";
import type { UserProfilePatchAllergyItem } from "@/api/types/user";
import {
  chronicConditionOptions,
  GENDERS,
  type GenderOptionValue,
  representativeFoodAllergyOptions,
  representativeMedicineAllergyOptions,
} from "@/constants/health-profile-options";
import { useUserStore } from "@/stores/userStore";
import { splitBloodTypeWithRhOrDefault } from "@/utils/blood-type";
import {
  chronicConditionLabelsToDiseaseCodes,
  profileAllergyLabelsToPatchItems,
} from "@/utils/user-mapper";
import type { ProfileTagSearchResult } from "./components/ProfileTagEditorCard";
import { type ProfileEditFormValues, profileEditSchema } from "./schema";

const MIN_ALLERGY_SEARCH_KEYWORD_LENGTH = 2;
const ALLERGY_SEARCH_DEBOUNCE_DELAY_MS = 250;

function createUniqueItems(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const item of items) {
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    next.push(normalized);
  }

  return next;
}

function createKnownChronicConditions(items: readonly string[]): string[] {
  const labels = new Set(chronicConditionOptions.map((option) => option.label));
  return createUniqueItems(items).filter((item) => labels.has(item));
}

function createKnownAllergies(items: readonly string[]): string[] {
  const labels = new Set(getRepresentativeAllergyOptions().map((option) => option.label));
  return createUniqueItems(items).filter((item) => labels.has(item));
}

function getRepresentativeAllergyOptions() {
  return [...representativeMedicineAllergyOptions, ...representativeFoodAllergyOptions];
}

export function useProfileEditViewModel() {
  const user = useUserStore((s) => s.user);
  const saveMutation = useUpdateUserProfileMutation();
  const [debouncedAllergyInput, setDebouncedAllergyInput] = useState("");
  const [selectedAllergyItems, setSelectedAllergyItems] = useState<
    Record<string, UserProfilePatchAllergyItem>
  >({});
  const initialGender: GenderOptionValue = GENDERS.includes(
    (user?.gender ?? "male") as GenderOptionValue,
  )
    ? ((user?.gender ?? "male") as GenderOptionValue)
    : "male";
  const { bloodType: initialBloodType, rhFactor: initialRhFactor } = splitBloodTypeWithRhOrDefault(
    user?.bloodType,
  );

  const initialName = user?.displayName ?? "";
  const initialAllergies = useMemo(
    () => createKnownAllergies(user?.allergies ?? []),
    [user?.allergies],
  );
  const initialChronic = useMemo(
    () => createKnownChronicConditions(user?.chronicConditions ?? []),
    [user?.chronicConditions],
  );

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      displayName: initialName,
      gender: initialGender,
      bloodType: initialBloodType,
      rhFactor: initialRhFactor,
      allergies: initialAllergies,
      chronicConditions: initialChronic,
      allergyInput: "",
      chronicInput: "",
    },
  });
  const { control, reset, setValue, getValues, handleSubmit } = form;
  const gender = useWatch({ control, name: "gender" });
  const bloodType = useWatch({ control, name: "bloodType" });
  const rhFactor = useWatch({ control, name: "rhFactor" });
  const allergyInput = useWatch({ control, name: "allergyInput" });
  const allergies = useWatch({ control, name: "allergies" });
  const chronicInput = useWatch({ control, name: "chronicInput" });
  const chronicConditions = useWatch({ control, name: "chronicConditions" });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAllergyInput(allergyInput.trim());
    }, ALLERGY_SEARCH_DEBOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [allergyInput]);

  const isAllergySearchEnabled = debouncedAllergyInput.length >= MIN_ALLERGY_SEARCH_KEYWORD_LENGTH;
  const { data: drugSearchResults, isFetching: isAllergySearchFetching } = useSearchDrugsQuery(
    debouncedAllergyInput,
    isAllergySearchEnabled,
  );
  const allergySearchResults = useMemo(() => {
    if (!isAllergySearchEnabled) return [];

    return (drugSearchResults ?? [])
      .filter((item) => !allergies.includes(item.drugName))
      .map((item) => ({
        id: `${item.drugCode}:${item.atcCode}:${item.drugName}`,
        label: item.drugName,
        meta: item.company ? `${item.company} · ${item.atcCode}` : item.atcCode,
        type: "ATC_GROUP",
        value: item.atcCode,
        name: item.drugName,
      }));
  }, [allergies, drugSearchResults, isAllergySearchEnabled]);

  useEffect(() => {
    reset({
      displayName: initialName,
      gender: initialGender,
      bloodType: initialBloodType,
      rhFactor: initialRhFactor,
      allergies: initialAllergies,
      chronicConditions: initialChronic,
      allergyInput: "",
      chronicInput: "",
    });
    setSelectedAllergyItems({});
  }, [
    initialAllergies,
    initialBloodType,
    initialChronic,
    initialGender,
    initialName,
    initialRhFactor,
    reset,
  ]);

  const addItem = (
    value: string,
    listField: "allergies" | "chronicConditions",
    inputField?: "allergyInput" | "chronicInput",
  ) => {
    const normalized = value.trim();
    if (!normalized) return;

    const current = getValues(listField);
    if (!current.includes(normalized)) {
      setValue(listField, [...current, normalized], { shouldDirty: true });
    }
    if (inputField) {
      setValue(inputField, "", { shouldDirty: true });
    }
  };

  const removeItem = (value: string, listField: "allergies" | "chronicConditions") => {
    const current = getValues(listField);
    setValue(
      listField,
      current.filter((item) => item !== value),
      { shouldDirty: true },
    );
  };

  const handleSubmitValid = (values: ProfileEditFormValues) => {
    saveMutation.mutate(
      {
        nickname: values.displayName.trim(),
        gender: values.gender === "female" ? "FEMALE" : "MALE",
        bloodType: values.bloodType,
        rhType: values.rhFactor === "negative" ? "MINUS" : "PLUS",
        diseaseCodes: chronicConditionLabelsToDiseaseCodes(values.chronicConditions),
        allergies: profileAllergyLabelsToPatchItems(values.allergies, selectedAllergyItems),
      },
      {
        onSuccess: () => router.back(),
        onError: () => {
          Alert.alert("저장 실패", "프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
        },
      },
    );
  };

  const onInvalid = () => {
    Alert.alert("입력 확인", "닉네임을 입력해주세요.");
  };

  return {
    control,
    gender,
    bloodType,
    rhFactor,
    allergyInput,
    allergies,
    chronicInput,
    chronicConditions,
    isSubmitting: saveMutation.isPending,
    handleBack: () => router.back(),
    handleGenderChange: (value: GenderOptionValue) =>
      setValue("gender", value, { shouldDirty: true }),
    handleBloodTypeChange: (value: ProfileEditFormValues["bloodType"]) =>
      setValue("bloodType", value, { shouldDirty: true }),
    handleRhFactorChange: (value: ProfileEditFormValues["rhFactor"]) =>
      setValue("rhFactor", value, { shouldDirty: true }),
    handleAllergyInputChange: (value: string) =>
      setValue("allergyInput", value, { shouldDirty: true }),
    handleChronicInputChange: () => undefined,
    handleAddAllergy: (value: string) => addItem(value, "allergies"),
    handleSelectAllergySearchResult: (result: ProfileTagSearchResult) => {
      setSelectedAllergyItems((prev) => ({
        ...prev,
        [result.label]: {
          type: result.type,
          value: result.value,
          name: result.name,
        },
      }));
      addItem(result.label, "allergies");
      setValue("allergyInput", "", { shouldDirty: true });
    },
    handleRemoveAllergy: (value: string) => {
      removeItem(value, "allergies");
      setSelectedAllergyItems((prev) => {
        const next = { ...prev };
        delete next[value];
        return next;
      });
    },
    handleAddChronicCondition: (value: string) => addItem(value, "chronicConditions"),
    handleRemoveChronicCondition: (value: string) => removeItem(value, "chronicConditions"),
    handleSubmit: handleSubmit(handleSubmitValid, onInvalid),
    allergySearchResults,
    isAllergySearchFetching,
  };
}
