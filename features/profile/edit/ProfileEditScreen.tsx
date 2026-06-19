import { Controller } from "react-hook-form";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import {
  ProfileBasicInfoCard,
  ProfileEditActionBar,
  ProfileEditHeader,
  ProfileEditNoticeCard,
  ProfileNicknameCard,
  ProfileTagEditorCard,
} from "@/features/profile/edit";
import { useProfileEditViewModel } from "./useProfileEditViewModel";

export function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const viewModel = useProfileEditViewModel();

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
        <ProfileEditHeader onBack={viewModel.handleBack} />
        <Controller
          control={viewModel.control}
          name="displayName"
          render={({ field: { value, onChange } }) => (
            <ProfileNicknameCard value={value} onChange={onChange} />
          )}
        />
        <ProfileBasicInfoCard
          gender={viewModel.gender}
          bloodType={viewModel.bloodType}
          rhFactor={viewModel.rhFactor}
          onGenderChange={viewModel.handleGenderChange}
          onBloodTypeChange={viewModel.handleBloodTypeChange}
          onRhFactorChange={viewModel.handleRhFactorChange}
        />
        <ProfileTagEditorCard
          variant="allergy"
          title="알러지"
          items={viewModel.allergies}
          inputValue={viewModel.allergyInput}
          inputPlaceholder="새 알러지 입력"
          onInputChange={viewModel.handleAllergyInputChange}
          onAddItem={viewModel.handleAddAllergy}
          onRemoveItem={viewModel.handleRemoveAllergy}
        />
        <ProfileTagEditorCard
          variant="chronic"
          title="기저질환"
          items={viewModel.chronicConditions}
          inputValue={viewModel.chronicInput}
          inputPlaceholder="새 기저질환 입력"
          onInputChange={viewModel.handleChronicInputChange}
          onAddItem={viewModel.handleAddChronicCondition}
          onRemoveItem={viewModel.handleRemoveChronicCondition}
        />
        <ProfileEditNoticeCard />
        <ProfileEditActionBar
          onCancel={viewModel.handleBack}
          onSubmit={viewModel.handleSubmit}
          isSubmitting={viewModel.isSubmitting}
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
