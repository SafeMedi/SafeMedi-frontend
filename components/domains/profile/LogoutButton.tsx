import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text } from "react-native";

import { palette } from "@/constants/design-tokens";

export type LogoutButtonProps = {
  onPress?: () => void;
};

export function LogoutButton({ onPress }: LogoutButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name="log-out-outline" size={16} color={palette.red_strong} />
      <Text style={styles.label}>로그아웃</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: palette.gray,
    borderColor: palette.red_soft,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: palette.red_strong,
  },
});
