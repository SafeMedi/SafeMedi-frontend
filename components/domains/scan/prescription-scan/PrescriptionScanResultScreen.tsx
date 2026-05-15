import { router } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { PillButton } from "@/components/ui/PillButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { usePrescriptionOcrResultStore } from "./usePrescriptionOcrResultStore";

export function PrescriptionScanResultScreen() {
  const insets = useSafeAreaInsets();
  const result = usePrescriptionOcrResultStore((state) => state.result);

  useEffect(() => {
    if (!result) {
      router.replace("/(detail)/scan");
    }
  }, [result]);

  if (!result) {
    return null;
  }

  return (
    <YStack style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 14 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={12}>
          <Text style={styles.title}>OCR 추출 결과</Text>
          <Text style={styles.subtitle}>선택한 이미지에서 인식된 원문 텍스트입니다.</Text>
          <SurfaceCard style={styles.card}>
            <Text style={styles.sectionTitle}>원문 텍스트</Text>
            <ScrollView
              style={styles.textBox}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.rawText}>{result.draft.rawText}</Text>
            </ScrollView>
          </SurfaceCard>
        </YStack>
      </ScrollView>
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 12 }]}>
        <PillButton
          variant="outline"
          onPress={() => router.back()}
          accessibilityLabel="스캔 화면으로 돌아가기"
          flex={0}
        >
          <Text style={styles.backButtonText}>돌아가기</Text>
        </PillButton>
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
  },
  title: {
    color: palette.black,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: palette.icon,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  textBox: {
    maxHeight: 420,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border_muted,
    backgroundColor: palette.surface_subtle,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  rawText: {
    color: palette.black,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "monospace",
  },
  bottomActions: {
    borderTopWidth: 1,
    borderTopColor: palette.dark_gray,
    backgroundColor: palette.overlay_white_90,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButtonText: {
    color: palette.green_deep,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});
