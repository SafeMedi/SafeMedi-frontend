import { Button, Text } from "tamagui";
import { palette } from "@/constants/design-tokens";

type SelectChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  flex?: number;
  height?: number;
  px?: number;
  selectedBackground?: string;
  unselectedBackground?: string;
  selectedBorderColor?: string;
  unselectedBorderColor?: string;
  borderWidth?: number;
};

export function SelectChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
  flex,
  height = 38,
  px = 16,
  selectedBackground = palette.color_green,
  unselectedBackground = "rgba(255,255,255,0.9)",
  selectedBorderColor = palette.color_green,
  unselectedBorderColor = palette.color_gray,
  borderWidth = 1,
}: SelectChipProps) {
  return (
    <Button
      unstyled
      onPress={onPress}
      borderWidth={borderWidth}
      height={height}
      px={px}
      py={0}
      items="center"
      justify="center"
      pressStyle={{ opacity: 0.85 }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        borderRadius: 999,
        flex,
        backgroundColor: selected ? selectedBackground : unselectedBackground,
        borderColor: selected ? selectedBorderColor : unselectedBorderColor,
        overflow: "hidden",
      }}
    >
      <Text fontSize={14} fontWeight="600" style={{ color: selected ? "#FFFFFF" : palette.text_black }}>
        {label}
      </Text>
    </Button>
  );
}
