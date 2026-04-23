import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";

import { ListLinkRow } from "@/components/ui/ListLinkRow";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { palette } from "@/constants/design-tokens";

export type SettingsSectionProps = {
  onPrivacyPress?: () => void;
};

export function SettingsSection({ onPrivacyPress }: SettingsSectionProps) {
  const [medicationAlarm, setMedicationAlarm] = useState(true);
  const [familyAlarm, setFamilyAlarm] = useState(true);

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
              onValueChange={setMedicationAlarm}
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
              onValueChange={setFamilyAlarm}
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
