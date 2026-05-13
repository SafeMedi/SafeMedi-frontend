import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "tamagui";
import { palette } from "@/constants/design-tokens";

interface PrescriptionScanHeaderProps {
  readonly onPressClose: () => void;
}

export function PrescriptionScanHeader({ onPressClose }: PrescriptionScanHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>처방전 스캔</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="스캔 화면 닫기"
        onPress={onPressClose}
        style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
      >
        <Ionicons name="close" size={20} color={palette.black} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: palette.dark_gray,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    backgroundColor: palette.overlay_white_90,
  },
  title: {
    color: palette.black,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.65,
  },
});
