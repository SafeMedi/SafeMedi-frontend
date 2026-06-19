import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import { useFamilyManageOverview } from "@/api/queries/family";
import { palette } from "@/constants/design-tokens";
import { FamilyFeatureBanner } from "./components/FamilyFeatureBanner";
import { FamilyInviteCard } from "./components/FamilyInviteCard";
import { FamilyManageHeader } from "./components/FamilyManageHeader";
import { FamilyMembersSection } from "./components/FamilyMembersSection";
import { PendingInvitesSection } from "./components/PendingInvitesSection";

export function FamilyManageScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useFamilyManageOverview();
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
          {isLoading ? (
            <View style={styles.feedbackContainer}>
              <ActivityIndicator size="large" color={palette.green} />
              <Text style={styles.feedbackText}>가족 정보를 불러오는 중입니다.</Text>
            </View>
          ) : null}

          {isError ? (
            <YStack items="center" gap={12} style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>가족 정보를 불러오지 못했습니다.</Text>
              <Pressable
                onPress={() => refetch()}
                accessibilityRole="button"
                accessibilityLabel="가족 정보 다시 시도"
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </YStack>
          ) : null}

          {!isLoading && !isError ? (
            <>
              <FamilyFeatureBanner />
              <FamilyInviteCard
                inviteLink={inviteLink}
                onCopyLink={handleCopyLink}
                onShareLink={handleShareLink}
              />
              <FamilyMembersSection members={members} />
              <PendingInvitesSection invites={pendingInvites} />
            </>
          ) : null}
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
  feedbackContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 10,
  },
  feedbackText: {
    color: palette.black,
    fontSize: 14,
    fontWeight: "500",
  },
  retryText: {
    color: palette.green_deep,
    fontSize: 14,
    fontWeight: "700",
  },
  retryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.green_soft,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
