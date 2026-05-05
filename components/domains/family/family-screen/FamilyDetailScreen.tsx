import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  type DimensionValue,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { useFamilyDetail } from "@/api/queries/family";
import type { FamilyMedicationScheduleItem, FamilyTodayMedicationSummary } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { PillButton } from "@/components/ui/PillButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { FamilyMedicationScheduleCard } from "./FamilyMedicationScheduleCard";
import { FamilyScreenHeader } from "./FamilyScreenHeader";

interface FamilyDetailScreenProps {
  readonly familyId: number | null;
}

const RELATION_LABEL: Record<string, string> = {
  MOTHER: "어머니",
  FATHER: "아버지",
  SIBLING: "형제자매",
};

const EMPTY_MEDICATION_SUMMARY: FamilyTodayMedicationSummary = {
  completedCount: 0,
  totalCount: 0,
  completionRate: 0,
  remainingCount: 0,
};

const EMPTY_MEDICATION_SCHEDULES: readonly FamilyMedicationScheduleItem[] = [];

export function FamilyDetailScreen({ familyId }: FamilyDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useFamilyDetail(familyId);
  const isInvalidFamilyId = familyId === null;
  const relationLabel = data?.relation ? (RELATION_LABEL[data.relation] ?? data.relation) : "가족";
  const medicationSummary = data?.todayMedicationSummary ?? EMPTY_MEDICATION_SUMMARY;
  const medicationSchedules = data?.todayMedicationSchedules ?? EMPTY_MEDICATION_SCHEDULES;
  const percentage = medicationSummary.completionRate;
  const summaryLabel = data
    ? `${medicationSummary.completedCount} / ${medicationSummary.totalCount} 완료`
    : "-";
  const remainingBadgeLabel = data ? `${medicationSummary.remainingCount}개 남음` : "0개 남음";
  const progressWidthPercent: DimensionValue = `${Math.min(100, Math.max(0, percentage))}%`;

  const handleOpenHealthInfo = () => {
    router.push("/profile/health-info");
  };

  const handleDeleteFamily = () => {
    Alert.alert("가족 구성원 삭제", "삭제 기능은 다음 단계에서 API와 연결할 예정입니다.");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={14}>
          <FamilyScreenHeader
            title={`${relationLabel} 님`}
            subtitle="가족 구성원"
            onBack={() => router.back()}
          />

          {isLoading ? (
            <View style={styles.feedbackContainer}>
              <ActivityIndicator size="large" color={palette.green} />
              <Text style={styles.feedbackText}>가족 정보를 불러오는 중입니다.</Text>
            </View>
          ) : null}

          {isInvalidFamilyId || isError ? (
            <YStack gap={12} style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>
                {isInvalidFamilyId
                  ? "잘못된 가족 프로필 경로입니다."
                  : "가족 정보를 불러오지 못했습니다."}
              </Text>
              {!isInvalidFamilyId ? (
                <PillButton
                  variant="outline"
                  onPress={() => refetch()}
                  accessibilityLabel="가족 정보 다시 시도"
                  flex={0}
                >
                  <Text style={styles.retryText}>다시 시도</Text>
                </PillButton>
              ) : null}
            </YStack>
          ) : null}

          {!isLoading && !isInvalidFamilyId && !isError && data ? (
            <>
              <LinearGradient
                colors={[palette.blue, palette.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.privacyCard}
              >
                <XStack gap={10} items="flex-start">
                  <Ionicons name="shield-checkmark-outline" size={18} color={palette.white} />
                  <YStack gap={4} flex={1}>
                    <Text style={styles.privacyTitle}>개인정보 보호</Text>
                    <Text style={styles.privacyDescription}>
                      가족의 개인정보를 보호하기 위해 당일 복용 정보만 확인하실 수 있습니다.
                    </Text>
                  </YStack>
                </XStack>
              </LinearGradient>

              <SurfaceCard style={styles.adherenceCard}>
                <YStack gap={12}>
                  <XStack items="center" justify="space-between">
                    <YStack gap={2}>
                      <Text style={styles.adherenceTitle}>오늘의 복약 이행률</Text>
                      <Text style={styles.adherenceSub}>{summaryLabel}</Text>
                    </YStack>
                    <Text style={styles.adherenceRate}>{percentage}%</Text>
                  </XStack>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: progressWidthPercent }]} />
                  </View>
                </YStack>
              </SurfaceCard>

              <YStack gap={8}>
                <SectionHeader
                  icon={<Ionicons name="calendar-outline" size={16} color={palette.green} />}
                  title="오늘의 복약 스케줄"
                  action={
                    <Badge
                      label={remainingBadgeLabel}
                      backgroundColor={palette.light_green}
                      textColor={palette.green_deep}
                    />
                  }
                />
                <YStack gap={8}>
                  {medicationSchedules.length > 0 ? (
                    medicationSchedules.map((schedule) => (
                      <FamilyMedicationScheduleCard key={schedule.id} schedule={schedule} />
                    ))
                  ) : (
                    <SurfaceCard style={styles.adherenceCard}>
                      <Text style={styles.feedbackText}>오늘 예정된 복약 스케줄이 없습니다.</Text>
                    </SurfaceCard>
                  )}
                </YStack>
              </YStack>

              <LinearGradient
                colors={[...palette.bg_invite_icon]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryAction}
              >
                <Pressable
                  style={styles.actionPressable}
                  accessibilityRole="button"
                  accessibilityLabel="건강정보 상세보기"
                  onPress={handleOpenHealthInfo}
                >
                  <Ionicons name="shield-checkmark-outline" size={14} color={palette.white} />
                  <Text style={styles.primaryActionText}>건강정보 상세보기</Text>
                </Pressable>
              </LinearGradient>

              <Pressable
                style={styles.deleteAction}
                accessibilityRole="button"
                accessibilityLabel="가족 구성원 삭제"
                onPress={handleDeleteFamily}
              >
                <Ionicons name="trash-outline" size={14} color={palette.red_strong} />
                <Text style={styles.deleteActionText}>가족 구성원 삭제</Text>
              </Pressable>

              <LinearGradient
                colors={[palette.notice_bg_start, palette.notice_bg_end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tipCard}
              >
                <XStack gap={10} items="flex-start">
                  <Text style={styles.tipEmoji}>💡</Text>
                  <YStack gap={4} flex={1}>
                    <Text style={styles.tipTitle}>가족 케어 팁</Text>
                    <Text style={styles.tipDescription}>
                      가족이 복약을 놓쳤다면 알림을 보내 응원해주세요. 꾸준한 복약이 건강의
                      첫걸음입니다.
                    </Text>
                  </YStack>
                </XStack>
              </LinearGradient>
            </>
          ) : null}
        </YStack>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  privacyCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  privacyTitle: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "700",
  },
  privacyDescription: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.92,
  },
  adherenceCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  adherenceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.black,
  },
  adherenceSub: {
    fontSize: 12,
    color: palette.icon,
  },
  adherenceRate: {
    fontSize: 40,
    lineHeight: 42,
    color: palette.green_deep,
    fontWeight: "700",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: palette.surface_neutral,
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: palette.green,
  },
  feedbackContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 10,
  },
  feedbackText: { color: palette.black, fontSize: 14, fontWeight: "500" },
  retryText: { color: palette.green_deep, fontSize: 14, fontWeight: "700" },
  primaryAction: {
    borderRadius: 12,
    overflow: "hidden",
  },
  actionPressable: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryActionText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "600",
  },
  deleteAction: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.red_outline,
    backgroundColor: palette.gray,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deleteActionText: {
    color: palette.red_strong,
    fontSize: 13,
    fontWeight: "600",
  },
  tipCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.notice_border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  tipEmoji: {
    fontSize: 21,
    lineHeight: 28,
  },
  tipTitle: {
    color: palette.notice_title,
    fontSize: 12,
    fontWeight: "700",
  },
  tipDescription: {
    color: palette.notice_description,
    fontSize: 12,
    lineHeight: 18,
  },
});
