import { StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/design-tokens";

export type BadgeProps = {
  label: string;
  backgroundColor?: string;
  textColor?: string;
};

export function Badge({
  label,
  backgroundColor = palette.dark_gray,
  textColor = palette.white,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
});
