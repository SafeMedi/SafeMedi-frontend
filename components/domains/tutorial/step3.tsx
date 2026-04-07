import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Input, Text, XStack, YStack } from "tamagui";
import type { StepHandle } from "@/app/(auth)/tutorial";
import EmojiCard from "@/components/ui/EmojiCard";
import { SelectChip } from "@/components/ui/select-chip";
import { palette } from "@/constants/design-tokens";
import { useUserStore } from "@/stores/userStore";

const chronicConditionOptions = [
  { emoji: "❤️", label: "고혈압" },
  { emoji: "🩸", label: "당뇨병" },
  { emoji: "🫁", label: "천식" },
  { emoji: "🫘", label: "신장질환" },
  { emoji: "🫀", label: "간질환" },
  { emoji: "💓", label: "심장질환" },
] as const;

function toggleSelection(list: string[], item: string) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

const Step3 = forwardRef<StepHandle>(function Step3(_props, ref) {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const [selectedPreset, setSelectedPreset] = useState<string[]>(() =>
    (user?.chronicConditions ?? []).filter((c) =>
      chronicConditionOptions.some((o) => o.label === c),
    ),
  );
  const [customInput, setCustomInput] = useState("");
  const [customConditions, setCustomConditions] = useState<string[]>(() =>
    (user?.chronicConditions ?? []).filter(
      (c) => !chronicConditionOptions.some((o) => o.label === c),
    ),
  );

  const allSelected = useMemo(
    () => [...selectedPreset, ...customConditions],
    [customConditions, selectedPreset],
  );

  const handleAddCustom = useCallback(() => {
    const normalized = customInput.trim();
    if (!normalized) return;
    if (allSelected.includes(normalized)) {
      setCustomInput("");
      return;
    }
    setCustomConditions((prev) => [...prev, normalized]);
    setCustomInput("");
  }, [allSelected, customInput]);

  useImperativeHandle(
    ref,
    () => ({
      submit: () =>
        new Promise<boolean>((resolve) => {
          const trimmed = customInput.trim();
          const mergedCustom =
            trimmed && !allSelected.includes(trimmed)
              ? [...customConditions, trimmed]
              : customConditions;
          updateUser({ chronicConditions: [...selectedPreset, ...mergedCustom] });
          resolve(true);
        }),
    }),
    [allSelected, customConditions, customInput, selectedPreset, updateUser],
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
            colors={[palette.color_blue, palette.color_purple]}
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
          <Text fontSize={18} fontWeight="700" color={palette.text_black}>
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

        <YStack gap={10}>
          <Text fontSize={14} fontWeight="600" color={palette.text_black}>
            ✏️ 직접 입력
          </Text>

          <XStack gap={10} items="center">
            <Input
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={handleAddCustom}
              placeholder="선택지에 없는 기저질환 입력"
              bg={palette.bg_gray}
              fontSize={15}
              flex={1}
              style={{
                color: palette.text_black,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: palette.color_gray,
              }}
            />

            <LinearGradient
              colors={[palette.color_blue, palette.color_purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 12 }}
            >
              <Pressable
                onPress={handleAddCustom}
                android_ripple={{ color: "transparent", borderless: true }}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
                accessibilityRole="button"
                accessibilityLabel="기저질환 직접 입력 추가"
              >
                <Ionicons name="add" size={18} color={palette.background} />
              </Pressable>
            </LinearGradient>
          </XStack>

          {customConditions.length > 0 ? (
            <XStack gap={8} flexWrap="wrap">
              {customConditions.map((item) => (
                <SelectChip
                  key={item}
                  label={item}
                  selected
                  borderWidth={0}
                  unselectedBackground={palette.color_gray}
                  selectedBackground={palette.color_blue}
                  onPress={() =>
                    setCustomConditions((prev) => prev.filter((value) => value !== item))
                  }
                />
              ))}
            </XStack>
          ) : null}

          <Text fontSize={12} color={palette.icon} style={{ textAlign: "center" }}>
            기저질환에 따라 피해야 할 약물을 분석합니다
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  );
});

export default Step3;
