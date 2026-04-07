import { Pressable } from "react-native";
import { Text, YStack } from "tamagui";
import { palette } from "@/constants/design-tokens";

type EmojiCardProps = {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
};

function EmojiCard({ emoji, label, selected, onPress }: EmojiCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${selected ? "선택됨" : "선택 안 됨"}`}
      style={{ flex: 1, minWidth: 0 }}
    >
      <YStack
        p={15}
        borderWidth={1.5}
        borderColor={selected ? palette.color_blue : "rgba(255,255,255,0.3)"}
        bg={palette.background}
        style={{
          minHeight: 107,
          borderRadius: 18,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        }}
        gap={10}
      >
        <Text fontSize={26}>{emoji}</Text>
        <Text fontSize={12} fontWeight="500" color={palette.text_black}>
          {label}
        </Text>
      </YStack>
    </Pressable>
  );
}

export default EmojiCard;