import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import type { DashboardScheduleCardItem } from "@/components/domains/dashboard/home/useDashboardViewModel";
import { Badge } from "@/components/ui/Badge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

interface ToneStyle {
  readonly headerGradient: readonly [string, string];
  readonly contentGradient: readonly [string, string];
  readonly contentBorder: string;
  readonly badgeTextColor: string;
}

const TONE_STYLES: Record<DashboardScheduleCardItem["tone"], ToneStyle> = {
  success: {
    headerGradient: [palette.green, palette.opal],
    contentGradient: [palette.green, palette.opal],
    contentBorder: palette.light_green,
    badgeTextColor: palette.green_deep,
  },
  required: {
    headerGradient: [palette.pending_status_bg, palette.pending_status_bg_end],
    contentGradient: [palette.blue, palette.purple],
    contentBorder: palette.schedule_required_border,
    badgeTextColor: palette.notice_description,
  },
  upcoming: {
    headerGradient: [palette.schedule_upcoming_start, palette.schedule_upcoming_end],
    contentGradient: [palette.schedule_upcoming_start, palette.schedule_upcoming_end],
    contentBorder: palette.schedule_upcoming_border,
    badgeTextColor: palette.icon,
  },
};

interface TodayScheduleCardProps {
  readonly item: DashboardScheduleCardItem;
}

export function TodayScheduleCard({ item }: TodayScheduleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const toneStyle = TONE_STYLES[item.tone];
  const medicationRows = useMemo(() => {
    const countMap = new Map<string, number>();
    return item.medicationNames.map((name) => {
      const count = (countMap.get(name) ?? 0) + 1;
      countMap.set(name, count);
      return {
        key: `${item.id}-${name}-${count}`,
        name,
      };
    });
  }, [item.id, item.medicationNames]);

  const handleToggleMedicationList = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <SurfaceCard style={styles.card}>
      <LinearGradient
        colors={[...toneStyle.headerGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <XStack items="center" justify="space-between">
          <XStack items="center" gap={10}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={16} color={palette.white} />
            </View>
            <YStack gap={2}>
              <Text style={styles.timeText}>{item.scheduledTime}</Text>
              <Text style={styles.countText}>{item.prescriptionCount}개 처방전</Text>
            </YStack>
          </XStack>
          <Badge
            label={item.statusLabel}
            backgroundColor={palette.overlay_white_90}
            textColor={toneStyle.badgeTextColor}
          />
        </XStack>
      </LinearGradient>

      <View style={[styles.bottomWrap, { borderColor: toneStyle.contentBorder }]}>
        <LinearGradient
          colors={[...toneStyle.contentGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bottom}
        >
          <XStack items="center" justify="space-between">
            <XStack items="center" gap={8}>
              <View style={styles.bottomIconCircle}>
                <Ionicons name="document-text-outline" size={12} color={palette.white} />
              </View>
              <YStack gap={2}>
                <Text style={styles.prescriptionTitle}>📋 {item.prescriptionTitle}</Text>
                <Text style={styles.medicationCount}>{item.medicationCount}개 약물</Text>
              </YStack>
            </XStack>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="복약 상세 보기"
              style={styles.arrowButton}
              onPress={handleToggleMedicationList}
            >
              <Ionicons
                name={isExpanded ? "chevron-down" : "chevron-forward"}
                size={14}
                color={palette.icon}
              />
            </Pressable>
          </XStack>
        </LinearGradient>

        {isExpanded ? (
          <View style={styles.medicationListContainer}>
            {medicationRows.length > 0 ? (
              medicationRows.map((medicationRow) => (
                <XStack key={medicationRow.key} items="center" gap={6}>
                  <Text style={styles.medicationBullet}>•</Text>
                  <Text style={styles.medicationText}>{medicationRow.name}</Text>
                </XStack>
              ))
            ) : (
              <Text style={styles.medicationText}>약물 정보가 없습니다.</Text>
            )}
          </View>
        ) : null}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.overlay_white_25,
  },
  timeText: {
    color: palette.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  countText: {
    color: palette.overlay_white_92,
    fontSize: 11,
    lineHeight: 14,
  },
  bottomWrap: {
    marginHorizontal: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  bottom: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  bottomIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.overlay_white_25,
  },
  prescriptionTitle: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  medicationCount: {
    color: palette.overlay_white_92,
    fontSize: 10,
    lineHeight: 14,
  },
  arrowButton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: palette.overlay_white_90,
    alignItems: "center",
    justifyContent: "center",
  },
  medicationListContainer: {
    borderTopWidth: 1,
    borderTopColor: palette.surface_card_border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    backgroundColor: palette.overlay_white_90,
  },
  medicationBullet: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 16,
  },
  medicationText: {
    flex: 1,
    color: palette.black,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
});
