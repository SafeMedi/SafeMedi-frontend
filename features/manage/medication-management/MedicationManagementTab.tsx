import { StyleSheet } from "react-native";
import { Text } from "tamagui";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

export function MedicationManagementTab() {
  return (
    <SurfaceCard style={styles.placeholderCard}>
      <Text style={styles.placeholderTitle}>복약 관리</Text>
      <Text style={styles.placeholderDescription}>해당 탭은 준비 중입니다.</Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
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
