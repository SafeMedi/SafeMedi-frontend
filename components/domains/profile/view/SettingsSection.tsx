import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";

import type { NotificationSettings } from "@/api/types";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/api/queries/profile";
import { ListLinkRow } from "@/components/ui/ListLinkRow";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { palette } from "@/constants/design-tokens";

export type SettingsSectionProps = {
  onPrivacyPress?: () => void;
};

export function SettingsSection({ onPrivacyPress }: SettingsSectionProps) {
  const { data: settings } = useNotificationSettings();
  const { mutate: updateSettings, isPending: isUpdatingSettings } = useUpdateNotificationSettings();
  const isSettingsReady = !!settings;
  const medicationAlarm = settings?.isMyReminderOn ?? true;
  const familyAlarm = settings?.isFamilyReminderOn ?? true;
  const isToggleDisabled = isUpdatingSettings || !isSettingsReady;

  const handleToggleSetting = (key: "isMyReminderOn" | "isFamilyReminderOn", next: boolean) => {
    const patch: Partial<Pick<NotificationSettings, "isMyReminderOn" | "isFamilyReminderOn">> = {
      [key]: next,
    };
    updateSettings(patch);
  };

  return (
    <YStack gap={10}>
      <Text style={styles.sectionTitle}>설정</Text>
      <SurfaceCard style={styles.card}>
        <ListLinkRow
          icon={<Ionicons name="notifications-outline" size={18} color={palette.purple} />}
          title="복약 알림"
          subtitle="복약 시간에 알림을 받습니다"
          trailing={
            <ToggleSwitch
              value={medicationAlarm}
              onValueChange={(next) => handleToggleSetting("isMyReminderOn", next)}
              disabled={isToggleDisabled}
              accessibilityLabel="복약 알림 토글"
            />
          }
          hasBorderBottom
        />
        <ListLinkRow
          icon={<Ionicons name="people-outline" size={18} color={palette.green_deep} />}
          title="가족 알림"
          subtitle="가족의 복약 알림을 받습니다"
          trailing={
            <ToggleSwitch
              value={familyAlarm}
              onValueChange={(next) => handleToggleSetting("isFamilyReminderOn", next)}
              disabled={isToggleDisabled}
              accessibilityLabel="가족 알림 토글"
            />
          }
          hasBorderBottom
        />
        <ListLinkRow
          icon={<Ionicons name="lock-closed-outline" size={18} color={palette.black} />}
          title="개인정보 보호"
          showChevron
          onPress={onPrivacyPress}
        />
      </SurfaceCard>
    </YStack>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.black,
    letterSpacing: -0.15,
  },
  card: {
    backgroundColor: palette.white,
    borderColor: palette.dark_gray,
    overflow: "hidden",
  },
});
