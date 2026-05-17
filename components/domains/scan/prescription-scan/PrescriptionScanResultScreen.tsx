import Ionicons from "@expo/vector-icons/Ionicons";
import { Controller } from "react-hook-form";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { GradientCard } from "@/components/ui/GradientCard";
import { PillButton } from "@/components/ui/PillButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { PrescriptionScanHeader } from "./components/PrescriptionScanHeader";
import { usePrescriptionScanResultViewModel } from "./usePrescriptionScanResultViewModel";

const POSITIVE_GRADIENT = [palette.green, palette.opal] as const;
const ADD_GRADIENT = [palette.purple, palette.pink] as const;
const INDEX_BADGE_GRADIENT = [palette.purple, palette.pink] as const;

export function PrescriptionScanResultScreen() {
  const insets = useSafeAreaInsets();
  const viewModel = usePrescriptionScanResultViewModel();

  return (
    <YStack style={styles.screen}>
      <GradientCard
        gradientColors={palette.bg_pink_line}
        style={{ ...StyleSheet.absoluteFillObject }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View />
      </GradientCard>

      <YStack style={{ paddingTop: insets.top }}>
        <PrescriptionScanHeader onPressClose={viewModel.handlePressClose} title="복약 등록" />
      </YStack>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={12}>
          {viewModel.isManualInputMode ? null : (
            <GradientCard gradientColors={POSITIVE_GRADIENT} style={styles.successCard}>
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color={palette.white} />
                <YStack gap={2}>
                  <Text style={styles.successTitle}>텍스트 인식 완료!</Text>
                  <Text style={styles.successDescription}>
                    {viewModel.recognizedMedicationCount}개의 약물을 찾았어요
                  </Text>
                </YStack>
              </View>
            </GradientCard>
          )}

          <SurfaceCard style={styles.titleCard}>
            <Text style={styles.cardTitle}>처방전 제목</Text>
            <Controller
              control={viewModel.control}
              name="title"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="약국 처방"
                  placeholderTextColor={palette.input_placeholder}
                  style={styles.titleInput}
                />
              )}
            />
          </SurfaceCard>

          <YStack gap={10}>
            <SectionHeader
              icon={<Ionicons name="sparkles-outline" size={14} color={palette.purple} />}
              title="인식된 약물"
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="약물 추가"
                  onPress={viewModel.handlePressAddMedication}
                  style={({ pressed }) => [styles.addButtonPressable, pressed ? styles.pressed : null]}
                >
                  <GradientCard gradientColors={ADD_GRADIENT} style={styles.addButton}>
                    <Ionicons name="add" size={12} color={palette.white} />
                    <Text style={styles.addButtonText}>추가</Text>
                  </GradientCard>
                </Pressable>
              }
            />

            {viewModel.fields.map((field, index) => {
              const isEditing = viewModel.editingMedicationIndex === index;
              return (
                <SurfaceCard key={field.id} style={styles.medicationCard}>
                  <GradientCard gradientColors={INDEX_BADGE_GRADIENT} style={styles.indexBadge}>
                    <Text style={styles.indexBadgeText}>{index + 1}</Text>
                  </GradientCard>
                  <YStack flex={1} gap={4}>
                    <Controller
                      control={viewModel.control}
                      name={`medications.${index}.drugName`}
                      render={({ field: { value, onChange } }) =>
                        isEditing ? (
                          <TextInput
                            value={value}
                            onChangeText={onChange}
                            onBlur={() => viewModel.handleFinishEditMedication(index)}
                            autoFocus
                            style={styles.medicationInput}
                            placeholder="약물명 입력"
                            placeholderTextColor={palette.input_placeholder}
                          />
                        ) : (
                          <Text style={styles.medicationName}>{value}</Text>
                        )
                      }
                    />
                    <Controller
                      control={viewModel.control}
                      name={`medications.${index}.atcCode`}
                      render={({ field: { value } }) => (
                        <Text style={styles.medicationMeta}>
                          {value === "UNKNOWN" ? "ATC 코드 미상" : value}
                        </Text>
                      )}
                    />
                  </YStack>
                  <View style={styles.medicationActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`약물 ${index + 1} 수정`}
                      onPress={() => viewModel.handlePressEditMedication(index)}
                      style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
                    >
                      <Ionicons name="pencil-outline" size={16} color={palette.purple} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`약물 ${index + 1} 삭제`}
                      onPress={() => viewModel.handlePressRemoveMedication(index)}
                      style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
                    >
                      <Ionicons name="trash-outline" size={16} color={palette.red_medium} />
                    </Pressable>
                  </View>
                </SurfaceCard>
              );
            })}
          </YStack>

          <SurfaceCard style={styles.noticeCard}>
            <View style={styles.noticeRow}>
              <Ionicons name="alert-circle-outline" size={16} color={palette.orange} />
              <YStack gap={4} flex={1}>
                <Text style={styles.noticeTitle}>약물 정보 수정 가능</Text>
                <Text style={styles.noticeDescription}>
                  인식 결과가 정확하지 않다면 수정 버튼을 눌러 변경하거나 새 약물을 추가하세요.
                </Text>
              </YStack>
            </View>
          </SurfaceCard>
        </YStack>
      </ScrollView>

      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.bottomActionRow}>
          <PillButton
            variant="outline"
            onPress={viewModel.handlePressRetryScan}
            accessibilityLabel="다시 스캔"
            borderColor={palette.border_muted}
            backgroundColor={palette.surface_subtle}
          >
            <Text style={styles.retryText}>다시 스캔</Text>
          </PillButton>
          <PillButton
            variant="solid"
            onPress={viewModel.handlePressAnalyze}
            accessibilityLabel="성분 분석하기"
            backgroundColor={palette.green}
            disabled={viewModel.isSubmitting}
          >
            <Text style={styles.submitText}>
              {viewModel.isSubmitting ? "분석 중..." : "성분 분석하기"}
            </Text>
          </PillButton>
        </View>
      </View>
    </YStack>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  successCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  successTitle: {
    color: palette.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  successDescription: {
    color: palette.white,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  titleCard: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    gap: 10,
  },
  cardTitle: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  titleInput: {
    backgroundColor: palette.gray,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    lineHeight: 20,
    color: palette.black,
  },
  addButtonPressable: {
    borderRadius: 12,
  },
  addButton: {
    borderRadius: 12,
    minHeight: 28,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  addButtonText: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  medicationCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderColor: palette.purple,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  indexBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  indexBadgeText: {
    color: palette.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  medicationName: {
    color: palette.black,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "600",
  },
  medicationInput: {
    borderWidth: 1,
    borderColor: palette.border_muted,
    backgroundColor: palette.surface_subtle,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: palette.black,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
  medicationMeta: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 16,
  },
  medicationActions: {
    flexDirection: "row",
    gap: 4,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeCard: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: palette.notice_bg_start,
    borderColor: palette.notice_border,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noticeTitle: {
    color: palette.notice_title,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  noticeDescription: {
    color: palette.notice_description,
    fontSize: 11,
    lineHeight: 16,
  },
  bottomActionBar: {
    borderTopWidth: 1,
    borderTopColor: palette.dark_gray,
    backgroundColor: palette.overlay_white_90,
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  bottomActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  retryText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  submitText: {
    color: palette.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
});
