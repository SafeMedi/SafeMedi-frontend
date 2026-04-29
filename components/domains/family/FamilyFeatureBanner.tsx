import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

export function FamilyFeatureBanner() {
  return (
    <LinearGradient
      colors={[...palette.bg_green_line]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SurfaceCard style={styles.overlay}>
        <XStack items="flex-start" gap={10}>
          <Ionicons name="people-outline" size={20} color={palette.white} />
          <YStack flex={1} gap={4}>
            <Text style={styles.title}>가족 건강 관리 기능</Text>
            <Text style={styles.description}>
              가족을 초대하면 복약 알림과 건강 정보를 함께 관리할 수 있어요. 서로의 복약 이행률을
              확인하고 응원할 수 있습니다.
            </Text>
          </YStack>
        </XStack>
      </SurfaceCard>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 18,
    overflow: "hidden",
  },
  overlay: {
    borderRadius: 18,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.white,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.white,
    opacity: 0.9,
  },
});
