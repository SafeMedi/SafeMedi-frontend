import { StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SelectChip } from "@/components/ui/SelectChip";
import { palette } from "@/constants/design-tokens";
import {
  type BloodTypeOptionValue,
  type GenderOptionValue,
  type RhFactorOptionValue,
  bloodOptions,
  genderOptions,
  rhOptions,
} from "@/constants/health-profile-options";

export type ProfileBasicInfoCardProps = {
  gender: GenderOptionValue;
  bloodType: BloodTypeOptionValue;
  rhFactor: RhFactorOptionValue;
  onGenderChange: (value: GenderOptionValue) => void;
  onBloodTypeChange: (value: BloodTypeOptionValue) => void;
  onRhFactorChange: (value: RhFactorOptionValue) => void;
};

export function ProfileBasicInfoCard({
  gender,
  bloodType,
  rhFactor,
  onGenderChange,
  onBloodTypeChange,
  onRhFactorChange,
}: ProfileBasicInfoCardProps) {
  return (
    <View style={styles.card}>
      <YStack gap={14}>
        <YStack gap={8}>
          <Text style={styles.title}>성별</Text>
          <XStack gap={8}>
            {genderOptions.map((option) => (
              <SelectChip
                key={option.value}
                label={option.label === "남성" ? "남자" : "여자"}
                selected={gender === option.value}
                onPress={() => onGenderChange(option.value)}
                flex={1}
              />
            ))}
          </XStack>
        </YStack>

        <YStack gap={8}>
          <Text style={styles.title}>혈액형</Text>
          <XStack gap={8} flexWrap="wrap">
            {bloodOptions.map((option) => (
              <SelectChip
                key={option.value}
                label={option.label}
                selected={bloodType === option.value}
                onPress={() => onBloodTypeChange(option.value)}
              />
            ))}
          </XStack>
          <XStack gap={8}>
            {rhOptions.map((option) => (
              <SelectChip
                key={option.value}
                label={option.label}
                selected={rhFactor === option.value}
                onPress={() => onRhFactorChange(option.value)}
                flex={1}
              />
            ))}
          </XStack>
        </YStack>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface_card,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    borderRadius: 18,
    padding: 16,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: palette.black,
    letterSpacing: -0.15,
  },
});
