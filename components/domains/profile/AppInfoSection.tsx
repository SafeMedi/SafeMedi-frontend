import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";

export type AppInfoLinkItem = {
  id: string;
  label: string;
  trailingText?: string;
  onPress?: () => void;
};

export type AppInfoSectionProps = {
  items: readonly AppInfoLinkItem[];
};

export function AppInfoSection({ items }: AppInfoSectionProps) {
  return (
    <YStack gap={7}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={item.onPress}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Text style={styles.label}>{item.label}</Text>
          <View style={styles.trailing}>
            {item.trailingText ? (
              <Text style={styles.trailingText}>{item.trailingText}</Text>
            ) : null}
            <Ionicons name="open-outline" size={14} color={palette.icon} />
          </View>
        </Pressable>
      ))}
    </YStack>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
    color: palette.black,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trailingText: {
    fontSize: 11,
    color: palette.icon,
  },
});
