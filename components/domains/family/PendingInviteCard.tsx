import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { Badge } from "@/components/ui/Badge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type { PendingFamilyInvite } from "./types";

type PendingInviteCardProps = {
  invite: PendingFamilyInvite;
};

export function PendingInviteCard({ invite }: PendingInviteCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <XStack items="center" justify="space-between" gap={12}>
        <XStack items="center" gap={10} flex={1}>
          <LinearGradient
            colors={[...palette.bg_pending_avatar]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Ionicons name="person-add-outline" size={20} color={palette.white} />
          </LinearGradient>
          <YStack gap={2} flex={1}>
            <Text style={styles.name}>{invite.relation}</Text>
            <Text style={styles.email}>{invite.email}</Text>
            <Text style={styles.date}>초대 발송: {invite.invitedAt}</Text>
          </YStack>
        </XStack>
        <Badge
          label="대기중"
          backgroundColor={palette.pending_status_bg}
          textColor={palette.white}
        />
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
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.black,
    letterSpacing: -0.15,
  },
  email: {
    fontSize: 12,
    color: palette.icon,
    lineHeight: 17,
  },
  date: {
    fontSize: 11,
    color: palette.input_placeholder,
    lineHeight: 14,
  },
});
