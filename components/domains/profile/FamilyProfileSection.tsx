import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text } from "react-native";
import { YStack } from "tamagui";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { palette } from "@/constants/design-tokens";

import { FamilyProfileItem } from "./FamilyProfileItem";
import type { FamilyProfile } from "./mock-data";

export type FamilyProfileSectionProps = {
  profiles: readonly FamilyProfile[];
  onAddFamily?: () => void;
  onSelectProfile?: (profile: FamilyProfile) => void;
};

export function FamilyProfileSection({
  profiles,
  onAddFamily,
  onSelectProfile,
}: FamilyProfileSectionProps) {
  return (
    <YStack gap={10}>
      <SectionHeader
        icon={<Ionicons name="people-outline" size={16} color={palette.black} />}
        title="가족 프로필"
        action={
          <Pressable onPress={onAddFamily} hitSlop={8}>
            <Text style={styles.actionText}>+ 가족 추가</Text>
          </Pressable>
        }
      />
      <YStack gap={7}>
        {profiles.map((profile) => (
          <FamilyProfileItem
            key={profile.id}
            name={profile.name}
            isActive={profile.isActive}
            avatarGradient={profile.avatarGradient}
            onPress={() => onSelectProfile?.(profile)}
          />
        ))}
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.green_deep,
  },
});
