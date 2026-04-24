import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { useUpdateUserProfileMutation } from "@/api/queries/user";
import {
  ProfileEditActionBar,
  ProfileEditHeader,
  ProfileEditNoticeCard,
  ProfileNicknameCard,
  ProfileTagEditorCard,
} from "@/components/domains/profile/edit";
import {
  type ProfileEditFormValues,
  profileEditSchema,
} from "@/components/domains/profile/edit/schema";
import { useUserStore } from "@/stores/userStore";
import { profileAllergyLabelsToApiCodes } from "@/utils/user-mapper";

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

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const user = useUserStore((s) => s.user);
  const saveMutation = useUpdateUserProfileMutation();

  const initialName = user?.displayName ?? "";
  const initialAllergies = useMemo(() => createUniqueItems(user?.allergies ?? []), [user?.allergies]);
  const initialChronic = useMemo(
    () => createUniqueItems(user?.chronicConditions ?? []),
    [user?.chronicConditions],
  );

  const { control, reset, setValue, getValues, handleSubmit } = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      displayName: initialName,
      allergies: initialAllergies,
      chronicConditions: initialChronic,
      allergyInput: "",
      chronicInput: "",
    },
  });

  useEffect(() => {
    reset({
      displayName: initialName,
      allergies: initialAllergies,
      chronicConditions: initialChronic,
      allergyInput: "",
      chronicInput: "",
    });
  }, [initialAllergies, initialChronic, initialName, reset]);

  const addItem = (value: string, listField: "allergies" | "chronicConditions", inputField?: "allergyInput" | "chronicInput") => {
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

  const onSubmit = (values: ProfileEditFormValues) => {
    saveMutation.mutate(
      {
        displayName: values.displayName.trim(),
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

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap={14}>
        <ProfileEditHeader onBack={() => router.back()} />
        <Controller
          control={control}
          name="displayName"
          render={({ field: { value, onChange } }) => (
            <ProfileNicknameCard value={value} onChange={onChange} />
          )}
        />
        <Controller
          control={control}
          name="allergyInput"
          render={({ field: { value: allergyInput, onChange: onAllergyInputChange } }) => (
            <Controller
              control={control}
              name="allergies"
              render={({ field: { value: allergies } }) => (
                <ProfileTagEditorCard
                  variant="allergy"
                  title="알러지"
                  items={allergies}
                  inputValue={allergyInput}
                  inputPlaceholder="새 알러지 입력"
                  onInputChange={onAllergyInputChange}
                  onAddItem={(value) => addItem(value, "allergies", "allergyInput")}
                  onRemoveItem={(value) => removeItem(value, "allergies")}
                />
              )}
            />
          )}
        />
        <Controller
          control={control}
          name="chronicInput"
          render={({ field: { value: chronicInput, onChange: onChronicInputChange } }) => (
            <Controller
              control={control}
              name="chronicConditions"
              render={({ field: { value: chronicConditions } }) => (
                <ProfileTagEditorCard
                  variant="chronic"
                  title="기저질환"
                  items={chronicConditions}
                  inputValue={chronicInput}
                  inputPlaceholder="새 기저질환 입력"
                  onInputChange={onChronicInputChange}
                  onAddItem={(value) =>
                    addItem(value, "chronicConditions", "chronicInput")
                  }
                  onRemoveItem={(value) => removeItem(value, "chronicConditions")}
                />
              )}
            />
          )}
        />
        <ProfileEditNoticeCard />
        <ProfileEditActionBar
          onCancel={() => router.back()}
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          isSubmitting={saveMutation.isPending}
        />
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
});
