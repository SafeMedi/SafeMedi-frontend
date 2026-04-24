import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";

import { useNotificationSettings, useUpdateNotificationSettings } from "@/api/queries/profile";
import { ListLinkRow } from "@/components/ui/ListLinkRow";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { palette } from "@/constants/design-tokens";
import type { NotificationSettings } from "@/api/types";

export type SettingsSectionProps = {
  onPrivacyPress?: () => void;
};

export function SettingsSection({ onPrivacyPress }: SettingsSectionProps) {
  const { data: settings } = useNotificationSettings();
  const { mutate: updateSettings, isPending: isUpdatingSettings } = useUpdateNotificationSettings();
  const [optimistic, setOptimistic] = useState<{
    isMyReminderOn: boolean;
    isFamilyReminderOn: boolean;
  } | null>(null);

  const syncedSettings = useMemo(
    () =>
      settings
        ? {
            isMyReminderOn: settings.isMyReminderOn,
            isFamilyReminderOn: settings.isFamilyReminderOn,
          }
        : null,
    [settings],
  );

  useEffect(() => {
    if (syncedSettings) {
      setOptimistic(syncedSettings);
    }
  }, [syncedSettings]);

  const medicationAlarm = optimistic?.isMyReminderOn ?? syncedSettings?.isMyReminderOn ?? true;
  const familyAlarm = optimistic?.isFamilyReminderOn ?? syncedSettings?.isFamilyReminderOn ?? true;

  const handleToggleSetting = (
    key: "isMyReminderOn" | "isFamilyReminderOn",
    next: boolean,
  ) => {
    const previous = optimistic ?? syncedSettings ?? { isMyReminderOn: true, isFamilyReminderOn: true };
    const patch: Partial<Pick<NotificationSettings, "isMyReminderOn" | "isFamilyReminderOn">> = {
      [key]: next,
    };

    setOptimistic({ ...previous, [key]: next });
    updateSettings(patch, {
      onError: () => setOptimistic(previous),
      onSuccess: (updated) =>
        setOptimistic({
          isMyReminderOn: updated.isMyReminderOn,
          isFamilyReminderOn: updated.isFamilyReminderOn,
        }),
    });
  };

  return (
    <YStack gap={10}>
      <Text style={styles.sectionTitle}>설정</Text>
      <View style={styles.card}>
        <ListLinkRow
          icon={<Ionicons name="notifications-outline" size={18} color={palette.purple} />}
          title="복약 알림"
          subtitle="복약 시간에 알림을 받습니다"
          trailing={
            <ToggleSwitch
              value={medicationAlarm}
              onValueChange={(next) => handleToggleSetting("isMyReminderOn", next)}
              disabled={isUpdatingSettings}
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
              disabled={isUpdatingSettings}
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
      </View>
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.dark_gray,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
