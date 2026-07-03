import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef, useImperativeHandle, useState } from "react";
import { ScrollView } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { EmojiCard } from "@/components/ui/EmojiCard";
import { palette } from "@/constants/design-tokens";
import { chronicConditionOptions } from "@/constants/health-profile-options";
import type { StepHandle } from "@/features/tutorial/types";
import { useUserStore } from "@/stores/userStore";
import { toggleSelection } from "@/utils/array";

export const Step3 = forwardRef<StepHandle>(function Step3(_props, ref) {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const [selectedPreset, setSelectedPreset] = useState<string[]>(() =>
    (user?.chronicConditions ?? []).filter((c) =>
      chronicConditionOptions.some((o) => o.label === c),
    ),
  );

  useImperativeHandle(
    ref,
    () => ({
      submit: () =>
        new Promise<boolean>((resolve) => {
          updateUser({ chronicConditions: selectedPreset });
          resolve(true);
        }),
    }),
    [selectedPreset, updateUser],
  );

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
    >
      <YStack gap={20} pt={8} pb={16}>
        <YStack items="center" gap={10} mt={8}>
          <LinearGradient
            colors={[palette.blue, palette.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 82,
              height: 82,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="shield-outline" size={42} color={palette.background} />
          </LinearGradient>
          <Text fontSize={18} fontWeight="700" color={palette.black}>
            기저질환
          </Text>
          <Text fontSize={16} color={palette.icon}>
            약물 상호작용을 정확하게 분석해요
          </Text>
        </YStack>

        <YStack gap={10}>
          {[0, 1, 2].map((row) => (
            <XStack key={row} gap={10} width="100%">
              {chronicConditionOptions.slice(row * 2, row * 2 + 2).map((opt) => {
                const selected = selectedPreset.includes(opt.label);
                return (
                  <EmojiCard
                    key={opt.label}
                    emoji={opt.emoji}
                    label={opt.label}
                    selected={selected}
                    onPress={() => setSelectedPreset((prev) => toggleSelection(prev, opt.label))}
                  />
                );
              })}
            </XStack>
          ))}
        </YStack>

        <Text fontSize={12} color={palette.icon} style={{ textAlign: "center" }}>
          기저질환에 따라 피해야 할 약물을 분석합니다
        </Text>
      </YStack>
    </ScrollView>
  );
});
