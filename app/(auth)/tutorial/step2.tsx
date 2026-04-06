import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { Button, Input, Text, XStack, YStack } from "tamagui";
import { SelectChip } from "@/components/ui/select-chip";
import { palette } from "@/constants/design-tokens";

const medicineAllergyOptions = ["페니실린", "아스피린", "소염진통제", "설파제"] as const;
const foodAllergyOptions = ["땅콩", "해산물", "유제품", "계란"] as const;

export type Step2Handle = {
  submit: () => Promise<boolean>;
};

function toggleSelection(list: string[], item: string) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

const Step2 = forwardRef<Step2Handle>(function Step2(_props, ref) {
  const [selectedMedicine, setSelectedMedicine] = useState<string[]>([]);
  const [selectedFood, setSelectedFood] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);

  const allSelectedAllergies = useMemo(
    () => [...selectedMedicine, ...selectedFood, ...customAllergies],
    [customAllergies, selectedFood, selectedMedicine],
  );

  const handleAddCustomAllergy = useCallback(() => {
    const normalized = customInput.trim();
    if (!normalized) return;
    if (allSelectedAllergies.includes(normalized)) {
      setCustomInput("");
      return;
    }
    setCustomAllergies((prev) => [...prev, normalized]);
    setCustomInput("");
  }, [allSelectedAllergies, customInput]);

  useImperativeHandle(
    ref,
    () => ({
      submit: () =>
        new Promise<boolean>((resolve) => {
          if (customInput.trim()) {
            handleAddCustomAllergy();
          }
          resolve(true);
        }),
    }),
    [customInput, handleAddCustomAllergy],
  );

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
    >
      <YStack gap={20} pt={8} pb={16}>
        <YStack items="center" gap={10} mt={8}>
          <YStack
            width={82}
            height={82}
            bg={palette.color_orange}
            items="center"
            justify="center"
            style={{ borderRadius: 999 }}
          >
            <Ionicons name="warning-outline" size={42} color="#FFFFFF" />
          </YStack>
          <Text fontSize={18} fontWeight="700" color={palette.text_black}>
            알러지 정보
          </Text>
          <Text fontSize={16} color={palette.icon}>
            위험한 약물을 미리 차단하세요
          </Text>
        </YStack>

        <AllergySection
          title="💊 약물 알러지"
          options={medicineAllergyOptions}
          selectedItems={selectedMedicine}
          onToggle={(item) => setSelectedMedicine((prev) => toggleSelection(prev, item))}
        />

        <AllergySection
          title="🍽️ 식품 알러지"
          options={foodAllergyOptions}
          selectedItems={selectedFood}
          onToggle={(item) => setSelectedFood((prev) => toggleSelection(prev, item))}
        />

        <YStack gap={10}>
          <Text fontSize={14} fontWeight="600" color={palette.text_black}>
            ✏️ 직접 입력
          </Text>

          <XStack gap={10} items="center">
            <Input
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={handleAddCustomAllergy}
              placeholder="선택지에 없는 알러지 입력"
              bg="#F4F5F7"
              fontSize={15}
              flex={1}
              style={{
                color: palette.text_black,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: palette.color_gray,
              }}
            />

            <Button
              size="$4"
              circular
              onPress={handleAddCustomAllergy}
              bg="#FF2D7A"
              pressStyle={{ opacity: 0.85 }}
              icon={<Ionicons name="add" size={18} color="#FFFFFF" />}
              accessibilityLabel="알러지 직접 입력 추가"
            />
          </XStack>

          {customAllergies.length > 0 ? (
            <XStack gap={8} flexWrap="wrap">
              {customAllergies.map((item) => (
                <SelectChip
                  key={item}
                  label={item}
                  selected
                  borderWidth={0}
                  unselectedBackground="#EDEFF2"
                  onPress={() => setCustomAllergies((prev) => prev.filter((value) => value !== item))}
                />
              ))}
            </XStack>
          ) : null}

          <Text fontSize={12} color={palette.icon} style={{ textAlign: "center" }}>
            선택하신 알러지 성분이 포함된 약물은 자동으로 경고됩니다
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  );
});

type AllergySectionProps = {
  title: string;
  options: readonly string[];
  selectedItems: string[];
  onToggle: (item: string) => void;
};

function AllergySection({ title, options, selectedItems, onToggle }: AllergySectionProps) {
  return (
    <YStack gap={10}>
      <Text fontSize={14} fontWeight="600" color={palette.text_black}>
        {title}
      </Text>
      <XStack gap={8} flexWrap="wrap">
        {options.map((item) => (
          <SelectChip
            key={item}
            label={item}
            selected={selectedItems.includes(item)}
            borderWidth={0}
            unselectedBackground="#EDEFF2"
            onPress={() => onToggle(item)}
          />
        ))}
      </XStack>
    </YStack>
  );
}

export default Step2;
