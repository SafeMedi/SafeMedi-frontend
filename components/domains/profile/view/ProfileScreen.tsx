import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { AppInfoSection } from "./components/AppInfoSection";
import { FamilyProfileSection } from "./components/FamilyProfileSection";
import { HealthInfoSection } from "./components/HealthInfoSection";
import { LogoutButton } from "./components/LogoutButton";
import { ProfilePageHeader } from "./components/ProfilePageHeader";
import { SettingsSection } from "./components/SettingsSection";
import { UserHeroCard } from "./components/UserHeroCard";
import { useProfileViewModel } from "./useProfileViewModel";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const viewModel = useProfileViewModel();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap={20}>
        <ProfilePageHeader />
        <UserHeroCard
          name={viewModel.profileUser.name}
          role={viewModel.profileUser.role}
          onPress={viewModel.handleOpenProfileEdit}
        />
        <FamilyProfileSection
          profiles={viewModel.familyProfiles}
          onAddFamily={viewModel.handleOpenFamilyManage}
          onSelectProfile={(profile) => viewModel.handleSelectFamilyProfile(profile.id)}
        />
        <HealthInfoSection
          allergies={viewModel.allergies}
          chronicConditions={viewModel.chronicConditions}
          onDetailPress={viewModel.handleOpenHealthInfoDetail}
          onEditAllergies={viewModel.handleOpenProfileEdit}
          onEditChronicConditions={viewModel.handleOpenProfileEdit}
        />
        <SettingsSection />
        <AppInfoSection items={viewModel.appInfoItems} />
        <LogoutButton onPress={viewModel.handleLogout} />
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
