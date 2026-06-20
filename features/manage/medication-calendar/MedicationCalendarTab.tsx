import { ActivityIndicator, StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";

import { PillButton } from "@/components/ui/PillButton";
import { palette } from "@/constants/design-tokens";
import { MedicationReportCalendarCard } from "./components/MedicationReportCalendarCard";
import { MedicationReportDailyRecordsCard } from "./components/MedicationReportDailyRecordsCard";
import { MedicationReportSummaryCard } from "./components/MedicationReportSummaryCard";
import { useMedicationCalendarViewModel } from "./useMedicationCalendarViewModel";

export function MedicationCalendarTab() {
  const viewModel = useMedicationCalendarViewModel();

  if (viewModel.isLoading) {
    return (
      <YStack style={styles.feedbackBox} gap={10}>
        <ActivityIndicator size="large" color={palette.green} />
        <Text style={styles.feedbackText}>복약 리포트를 불러오는 중입니다.</Text>
      </YStack>
    );
  }

  if (viewModel.isError) {
    return (
      <YStack style={styles.feedbackBox} gap={10}>
        <Text style={styles.feedbackText}>복약 리포트를 불러오지 못했습니다.</Text>
        <PillButton variant="outline" onPress={() => viewModel.refetch()} flex={0}>
          <Text style={styles.retryText}>다시 시도</Text>
        </PillButton>
      </YStack>
    );
  }

  return (
    <YStack gap={14}>
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
    </YStack>
  );
}

const styles = StyleSheet.create({
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
});
