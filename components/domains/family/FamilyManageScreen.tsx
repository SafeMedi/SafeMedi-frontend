import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useCallback } from "react";
import { Alert, ScrollView, Share, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { useFamilyManageOverview } from "@/api/queries/family";
import { palette } from "@/constants/design-tokens";
import { FamilyFeatureBanner } from "./FamilyFeatureBanner";
import { FamilyInviteCard } from "./FamilyInviteCard";
import { FamilyManageHeader } from "./FamilyManageHeader";
import { FamilyMembersSection } from "./FamilyMembersSection";
import { PendingInvitesSection } from "./PendingInvitesSection";

export function FamilyManageScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useFamilyManageOverview();
  const inviteLink = data?.inviteLink ?? "";
  const members = data?.members ?? [];
  const pendingInvites = data?.pendingInvites ?? [];

  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await Clipboard.setStringAsync(inviteLink);
      Alert.alert("복사 완료", "초대 링크를 클립보드에 복사했어요.");
    } catch {
      Alert.alert("복사 실패", "링크 복사에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }, [inviteLink]);

  const handleShareLink = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await Share.share({ message: inviteLink, url: inviteLink });
    } catch {
      Alert.alert("공유 실패", "링크 공유에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }, [inviteLink]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...palette.bg_family_manage]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={14}>
          <FamilyManageHeader onBack={() => router.back()} />
          <FamilyFeatureBanner />
          <FamilyInviteCard
            inviteLink={inviteLink}
            onCopyLink={handleCopyLink}
            onShareLink={handleShareLink}
          />
          <FamilyMembersSection members={members} />
          <PendingInvitesSection invites={pendingInvites} />
        </YStack>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
});
