import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { PillButton } from "@/components/ui/PillButton";
import { palette } from "@/constants/design-tokens";
import { ExtractedDraftCard } from "./components/ExtractedDraftCard";
import { ManualJsonInputCard } from "./components/ManualJsonInputCard";
import { PrescriptionFrameCard } from "./components/PrescriptionFrameCard";
import { PrescriptionScanActions } from "./components/PrescriptionScanActions";
import { PrescriptionScanHeader } from "./components/PrescriptionScanHeader";
import { usePrescriptionScanViewModel } from "./usePrescriptionScanViewModel";

export function PrescriptionScanScreen() {
  const insets = useSafeAreaInsets();
  const viewModel = usePrescriptionScanViewModel();

  const handlePressClose = () => {
    router.replace("/(tabs)/dashboard");
  };

  const handlePressRetry = async () => {
    await viewModel.retryExtract();
  };

  const handlePressSubmit = async () => {
    await viewModel.submitDraft();
  };

  useEffect(() => {
    if (!viewModel.error) return;
    Alert.alert("처방전 스캔 오류", viewModel.error.message, [
      {
        text: "확인",
        onPress: () => viewModel.resetError(),
      },
    ]);
  }, [viewModel.error, viewModel.resetError]);

  const isBusy = viewModel.isExtracting || viewModel.isSubmitting;

  return (
    <YStack style={styles.screen}>
      <YStack style={{ paddingTop: insets.top }}>
        <PrescriptionScanHeader onPressClose={handlePressClose} />
      </YStack>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 14 }]}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={12}>
          <PrescriptionFrameCard
            imageUri={viewModel.selectedImageUri}
            onPressManualInput={viewModel.openManualInput}
          />
          {viewModel.draft ? (
            <ExtractedDraftCard
              draftJson={viewModel.draftJson}
              isSubmitting={viewModel.isSubmitting}
              onPressSubmit={handlePressSubmit}
            />
          ) : null}
          {viewModel.isManualInputVisible ? (
            <ManualJsonInputCard
              value={viewModel.draftJson}
              onChangeText={viewModel.updateManualJson}
              onPressApply={viewModel.applyManualJson}
              onPressCancel={viewModel.closeManualInput}
            />
          ) : null}
          {viewModel.selectedImageUri && !viewModel.isExtracting ? (
            <PillButton
              variant="outline"
              onPress={handlePressRetry}
              accessibilityLabel="OCR 재시도"
              flex={0}
            >
              <Text style={styles.retryText}>같은 이미지로 다시 추출</Text>
            </PillButton>
          ) : null}
        </YStack>
      </ScrollView>
      <PrescriptionScanActions
        isBusy={isBusy}
        onPressGallery={viewModel.extractFromGallery}
        onPressCamera={viewModel.extractFromCamera}
      />
      {viewModel.isExtracting ? (
        <View style={styles.extractingOverlay}>
          <YStack style={styles.extractingDialog} gap={10}>
            <ActivityIndicator size="large" color={palette.green} />
            <Text style={styles.feedbackText}>OCR로 텍스트를 추출하는 중입니다.</Text>
          </YStack>
        </View>
      ) : null}
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
  extractingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.overlay_white_90,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  extractingDialog: {
    minWidth: 220,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: palette.surface_card,
    borderWidth: 1,
    borderColor: palette.border_muted,
    alignItems: "center",
    justifyContent: "center",
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
