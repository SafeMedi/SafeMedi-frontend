import { Pressable, StyleSheet, View } from "react-native";

import { palette } from "@/constants/design-tokens";

export type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const THUMB_SIZE = 20;
const PADDING = 3;

export function ToggleSwitch({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
}: ToggleSwitchProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.track,
        { backgroundColor: value ? palette.blue : palette.dark_gray, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <View
        style={[
          styles.thumb,
          { transform: [{ translateX: value ? TRACK_WIDTH - THUMB_SIZE - PADDING * 2 : 0 }] },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: "center",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: palette.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
