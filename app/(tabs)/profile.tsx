import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { useFamilyProfiles, useHealthInfo, useProfileUser } from "@/api/queries/profile";
import { queryKeys } from "@/api/query-keys";
import {
  AppInfoSection,
  FamilyProfileSection,
  HealthInfoSection,
  LogoutButton,
  ProfilePageHeader,
  SettingsSection,
  UserHeroCard,
} from "@/components/domains/profile/view";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";

const APP_VERSION = "v1.0.0";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clearUser);

  const profileUser = useProfileUser();
  const { data: familyProfiles = [] } = useFamilyProfiles();
  const { allergies, chronicConditions } = useHealthInfo();

  const handleLogout = () => {
    clearSession();
    clearUser();
    queryClient.removeQueries({ queryKey: queryKeys.user.me });
    queryClient.removeQueries({ queryKey: queryKeys.profile.families });
    queryClient.removeQueries({ queryKey: queryKeys.profile.notificationSettings });
  };

  const appInfoItems = useMemo(
    () => [
      { id: "app-info", label: "앱 정보", trailingText: APP_VERSION },
      { id: "terms", label: "이용약관" },
      { id: "privacy-policy", label: "개인정보 처리방침" },
    ],
    [],
  );

  const handleOpenProfileEdit = () => {
    router.push("/profile/edit");
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap={20}>
        <ProfilePageHeader />
        <UserHeroCard
          name={profileUser.name}
          role={profileUser.role}
          onPress={handleOpenProfileEdit}
        />
        <FamilyProfileSection profiles={familyProfiles} />
        <HealthInfoSection
          allergies={allergies}
          chronicConditions={chronicConditions}
          onEditAllergies={handleOpenProfileEdit}
          onEditChronicConditions={handleOpenProfileEdit}
        />
        <SettingsSection />
        <AppInfoSection items={appInfoItems} />
        <LogoutButton onPress={handleLogout} />
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
