import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

interface ScanPrescriptionCardProps {
  readonly onPress: () => void;
}

export function ScanPrescriptionCard({ onPress }: ScanPrescriptionCardProps) {
  return (
    <LinearGradient
      colors={[palette.green, palette.opal]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Pressable
        style={styles.pressable}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="처방전 스캔하기"
      >
        <XStack items="center" gap={12}>
          <View style={styles.iconWrap}>
            <Ionicons name="scan-outline" size={18} color={palette.white} />
          </View>
          <YStack gap={2}>
            <Text style={styles.title}>처방전 스캔하기</Text>
            <Text style={styles.description}>약물 성분을 안전하게 분석해요</Text>
          </YStack>
        </XStack>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  pressable: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.overlay_white_20,
  },
  title: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  description: {
    color: palette.overlay_white_92,
    fontSize: 12,
    lineHeight: 16,
  },
});
