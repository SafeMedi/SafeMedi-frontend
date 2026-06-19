import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert } from "react-native";

import { useUpdateUserProfileMutation } from "@/api/queries/user";
import { GENDERS, type GenderOptionValue } from "@/constants/health-profile-options";
import { useUserStore } from "@/stores/userStore";
import { combineBloodTypeWithRh, splitBloodTypeWithRhOrDefault } from "@/utils/blood-type";
import { profileAllergyLabelsToApiCodes } from "@/utils/user-mapper";
import { type ProfileEditFormValues, profileEditSchema } from "./schema";

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

export function useProfileEditViewModel() {
  const user = useUserStore((s) => s.user);
  const saveMutation = useUpdateUserProfileMutation();
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
    () => createUniqueItems(user?.allergies ?? []),
    [user?.allergies],
  );
  const initialChronic = useMemo(
    () => createUniqueItems(user?.chronicConditions ?? []),
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
        displayName: values.displayName.trim(),
        gender: values.gender === "female" ? "F" : "M",
        bloodType: combineBloodTypeWithRh(values.bloodType, values.rhFactor),
        diseases: values.chronicConditions,
        allergies: profileAllergyLabelsToApiCodes(values.allergies),
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
    handleChronicInputChange: (value: string) =>
      setValue("chronicInput", value, { shouldDirty: true }),
    handleAddAllergy: (value: string) => addItem(value, "allergies", "allergyInput"),
    handleRemoveAllergy: (value: string) => removeItem(value, "allergies"),
    handleAddChronicCondition: (value: string) =>
      addItem(value, "chronicConditions", "chronicInput"),
    handleRemoveChronicCondition: (value: string) => removeItem(value, "chronicConditions"),
    handleSubmit: handleSubmit(handleSubmitValid, onInvalid),
  };
}
