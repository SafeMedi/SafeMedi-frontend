import type { ReactNode } from "react";
import { Pressable } from "react-native";
import { palette } from "@/constants/design-tokens";

const BORDER_SUBTLE = "#E5E7EB";

export type PillButtonProps = {
  variant: "outline" | "solid";
  onPress: () => void;
  children: ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
  rightElement?: ReactNode;
  flex?: number;
};

export function PillButton({
  variant,
  onPress,
  children,
  disabled = false,
  accessibilityLabel,
  rightElement,
  flex: flexGrow = 1,
}: PillButtonProps) {
  const isOutline = variant === "outline";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => {
        let opacity = 1;
        if (disabled && isOutline) {
          opacity = 0.35;
        } else if (pressed) {
          opacity = isOutline ? 0.85 : 0.9;
        }
        return {
          flex: flexGrow,
          opacity,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 999,
          ...(isOutline
            ? {
                borderWidth: 1,
                borderColor: BORDER_SUBTLE,
                backgroundColor: "rgba(255, 255, 255, 0.85)",
              }
            : {
                backgroundColor: palette.green,
              }),
          alignItems: "center",
          justifyContent: "center",
          flexDirection: rightElement ? "row" : undefined,
          gap: rightElement ? 4 : undefined,
        };
      }}
    >
      {children}
      {rightElement}
    </Pressable>
  );
}
