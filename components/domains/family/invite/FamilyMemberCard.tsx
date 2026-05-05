import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { Badge } from "@/components/ui/Badge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type { FamilyMember } from "../types";

type FamilyMemberCardProps = {
  member: FamilyMember;
};

export function FamilyMemberCard({ member }: FamilyMemberCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <XStack items="center" justify="space-between" gap={12}>
        <XStack items="center" gap={10} flex={1}>
          <LinearGradient
            colors={[...palette.bg_invite_icon]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarEmoji}>{member.emoji}</Text>
          </LinearGradient>
          <YStack gap={2} flex={1}>
            <XStack items="center" gap={4}>
              <Text style={styles.name}>{member.name}</Text>
              <Ionicons name="checkmark-circle-outline" size={14} color={palette.green} />
            </XStack>
            <Text style={styles.relation}>{member.relation}</Text>
          </YStack>
        </XStack>
        {member.isActive ? (
          <Badge label="활성" backgroundColor={palette.green} textColor={palette.white} />
        ) : null}
      </XStack>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 21,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.black,
    letterSpacing: -0.15,
  },
  relation: {
    fontSize: 12,
    color: palette.icon,
    lineHeight: 17,
  },
});
