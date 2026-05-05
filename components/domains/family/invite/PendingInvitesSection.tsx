import { StyleSheet } from "react-native";
import { YStack } from "tamagui";

import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { palette } from "@/constants/design-tokens";
import type { PendingFamilyInvite } from "../types";
import { PendingInviteCard } from "./PendingInviteCard";

type PendingInvitesSectionProps = {
  invites: readonly PendingFamilyInvite[];
};

export function PendingInvitesSection({ invites }: PendingInvitesSectionProps) {
  return (
    <YStack gap={8}>
      <SectionHeader
        title="대기 중인 초대"
        action={
          <Badge
            label={String(invites.length)}
            backgroundColor={palette.pending_badge_bg}
            textColor={palette.pending_badge_text}
            textStyle={styles.countBadgeText}
          />
        }
      />
      {invites.map((invite) => (
        <PendingInviteCard key={invite.id} invite={invite} />
      ))}
    </YStack>
  );
}

const styles = StyleSheet.create({
  countBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
