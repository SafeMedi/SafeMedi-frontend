import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { queryKeys } from "@/api/query-keys";
import { AppInfoSection } from "@/components/domains/profile/AppInfoSection";
import { FamilyProfileSection } from "@/components/domains/profile/FamilyProfileSection";
import { HealthInfoSection } from "@/components/domains/profile/HealthInfoSection";
import { LogoutButton } from "@/components/domains/profile/LogoutButton";
import {
  APP_VERSION,
  MOCK_ALLERGIES,
  MOCK_CHRONIC_CONDITIONS,
  MOCK_FAMILY_PROFILES,
  MOCK_USER,
} from "@/components/domains/profile/mock-data";
import { ProfilePageHeader } from "@/components/domains/profile/ProfilePageHeader";
import { SettingsSection } from "@/components/domains/profile/SettingsSection";
import { UserHeroCard } from "@/components/domains/profile/UserHeroCard";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clearUser);

  const handleLogout = () => {
    clearSession();
    clearUser();
    queryClient.removeQueries({ queryKey: queryKeys.user.me });
  };

  const appInfoItems = useMemo(
    () => [
      { id: "app-info", label: "앱 정보", trailingText: APP_VERSION },
      { id: "terms", label: "이용약관" },
      { id: "privacy-policy", label: "개인정보 처리방침" },
    ],
    [],
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap={20}>
        <ProfilePageHeader />
        <UserHeroCard name={MOCK_USER.name} role={MOCK_USER.role} />
        <FamilyProfileSection profiles={MOCK_FAMILY_PROFILES} />
        <HealthInfoSection allergies={MOCK_ALLERGIES} chronicConditions={MOCK_CHRONIC_CONDITIONS} />
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
