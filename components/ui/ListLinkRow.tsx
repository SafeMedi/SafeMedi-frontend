import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  type PressableStateCallbackType,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { palette } from "@/constants/design-tokens";

export type ListLinkRowProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  showChevron?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  hasBorderBottom?: boolean;
};

export function ListLinkRow({
  icon,
  title,
  subtitle,
  trailing,
  showChevron,
  onPress,
  hasBorderBottom,
}: ListLinkRowProps) {
  const containerStyle = ({ pressed }: PressableStateCallbackType) => [
    styles.container,
    hasBorderBottom ? styles.border : null,
    pressed && onPress ? styles.pressed : null,
  ];

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={containerStyle}>
      <View style={styles.leading}>
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.trailing}>
        {trailing}
        {showChevron ? <Ionicons name="chevron-forward" size={18} color={palette.icon} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  border: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.dark_gray,
  },
  pressed: {
    opacity: 0.6,
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: palette.black,
    letterSpacing: -0.15,
  },
  subtitle: {
    fontSize: 11,
    color: palette.icon,
    lineHeight: 14,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
