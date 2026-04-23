import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { palette } from "@/constants/design-tokens";

import { FAMILY_ACTIVE_STYLE } from "./constants";

export type FamilyProfileItemProps = {
  name: string;
  isActive: boolean;
  avatarGradient: readonly [string, string];
  onPress?: () => void;
};

export function FamilyProfileItem({
  name,
  isActive,
  avatarGradient,
  onPress,
}: FamilyProfileItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {isActive ? (
        <LinearGradient
          colors={[...FAMILY_ACTIVE_STYLE.gradientColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.card, { borderColor: FAMILY_ACTIVE_STYLE.borderColor }]}
        >
          <ItemContent name={name} isActive avatarGradient={avatarGradient} />
        </LinearGradient>
      ) : (
        <View style={[styles.card, styles.inactiveCard]}>
          <ItemContent name={name} isActive={false} avatarGradient={avatarGradient} />
        </View>
      )}
    </Pressable>
  );
}

function ItemContent({
  name,
  isActive,
  avatarGradient,
}: {
  name: string;
  isActive: boolean;
  avatarGradient: readonly [string, string];
}) {
  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        <LinearGradient
          colors={[...avatarGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Ionicons name="person" size={18} color={palette.white} />
        </LinearGradient>
        <View style={styles.textWrap}>
          <Text style={styles.name}>{name}</Text>
          {isActive ? (
            <Text style={[styles.activeLabel, { color: FAMILY_ACTIVE_STYLE.activeTextColor }]}>
              현재 활성
            </Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 18,
  },
  pressed: {
    opacity: 0.8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inactiveCard: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderColor: "rgba(255,255,255,0.3)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: palette.text,
    letterSpacing: -0.15,
  },
  activeLabel: {
    fontSize: 10,
    lineHeight: 14,
  },
});
