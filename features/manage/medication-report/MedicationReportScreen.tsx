import { ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import { PillButton } from "@/components/ui/PillButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { MedicationReportCalendarCard } from "./components/MedicationReportCalendarCard";
import { MedicationReportDailyRecordsCard } from "./components/MedicationReportDailyRecordsCard";
import { MedicationReportHeader } from "./components/MedicationReportHeader";
import { MedicationReportSummaryCard } from "./components/MedicationReportSummaryCard";
import { MedicationReportTabBar } from "./components/MedicationReportTabBar";
import { useMedicationReportViewModel } from "./useMedicationReportViewModel";

export function MedicationReportScreen() {
  const insets = useSafeAreaInsets();
  const viewModel = useMedicationReportViewModel();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap={14}>
        <MedicationReportHeader />

        <MedicationReportTabBar
          activeTab={viewModel.activeTab}
          onChangeTab={viewModel.setActiveTab}
        />

        {viewModel.isLoading ? (
          <YStack style={styles.feedbackBox} gap={10}>
            <ActivityIndicator size="large" color={palette.green} />
            <Text style={styles.feedbackText}>복약 리포트를 불러오는 중입니다.</Text>
          </YStack>
        ) : null}

        {viewModel.isError ? (
          <YStack style={styles.feedbackBox} gap={10}>
            <Text style={styles.feedbackText}>복약 리포트를 불러오지 못했습니다.</Text>
            <PillButton variant="outline" onPress={() => viewModel.refetch()} flex={0}>
              <Text style={styles.retryText}>다시 시도</Text>
            </PillButton>
          </YStack>
        ) : null}

        {!viewModel.isLoading && !viewModel.isError && viewModel.activeTab === "calendar" ? (
          <>
            <MedicationReportSummaryCard
              complianceRate={viewModel.complianceRate}
              periodRangeLabel={viewModel.periodRangeLabel}
              perfectDaysCount={viewModel.perfectDaysCount}
              attentionDaysCount={viewModel.attentionDaysCount}
            />

            <MedicationReportCalendarCard
              monthLabel={viewModel.monthLabel}
              weeks={viewModel.calendarWeeks}
              selectedDate={viewModel.selectedDate}
              onSelectDate={viewModel.setSelectedDate}
            />

            <MedicationReportDailyRecordsCard
              title={viewModel.selectedDateTitle}
              summary={viewModel.selectedDaySummary}
              prescriptionGroups={viewModel.prescriptionGroups}
            />
          </>
        ) : null}

        {!viewModel.isLoading && !viewModel.isError && viewModel.activeTab !== "calendar" ? (
          <SurfaceCard style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>
              {viewModel.activeTab === "statistics" ? "통계 분석" : "복약 관리"}
            </Text>
            <Text style={styles.placeholderDescription}>해당 탭은 준비 중입니다.</Text>
          </SurfaceCard>
        ) : null}
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
  },
  feedbackBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
  },
  feedbackText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  retryText: {
    color: palette.green_deep,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  placeholderCard: {
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 8,
  },
  placeholderTitle: {
    color: palette.title_emphasis,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  placeholderDescription: {
    color: palette.icon,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
