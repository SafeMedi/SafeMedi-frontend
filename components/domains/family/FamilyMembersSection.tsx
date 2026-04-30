import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet } from "react-native";
import { YStack } from "tamagui";

import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { palette } from "@/constants/design-tokens";

import { FamilyMemberCard } from "./FamilyMemberCard";
import type { FamilyMember } from "./types";

type FamilyMembersSectionProps = {
  members: readonly FamilyMember[];
};

export function FamilyMembersSection({ members }: FamilyMembersSectionProps) {
  return (
    <YStack gap={8}>
      <SectionHeader
        icon={<Ionicons name="people-outline" size={16} color={palette.green} />}
        title="현재 가족 구성원"
        action={
          <Badge
            label={`${members.length}명`}
            backgroundColor={palette.light_green}
            textColor={palette.green_deep}
            textStyle={styles.countBadgeText}
          />
        }
      />
      <YStack gap={8}>
        {members.map((member) => (
          <FamilyMemberCard key={member.id} member={member} />
        ))}
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  countBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
