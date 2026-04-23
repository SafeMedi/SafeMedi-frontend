import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useImperativeHandle } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { Input, Text, XStack, YStack } from "tamagui";
import type { StepHandle } from "@/app/(auth)/tutorial";
import {
  type TutorialStep1FormValues,
  tutorialStep1Schema,
} from "@/components/domains/tutorial/schema";
import { SelectChip } from "@/components/ui/SelectChip";
import { palette } from "@/constants/design-tokens";
import { bloodOptions, genderOptions } from "@/constants/health-profile-options";
import { useUserStore } from "@/stores/userStore";

const Step1 = forwardRef<StepHandle>(function Step1(_props, ref) {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const { control, handleSubmit } = useForm<TutorialStep1FormValues>({
    resolver: zodResolver(tutorialStep1Schema),
    defaultValues: {
      height: user?.height != null ? String(user.height) : "",
      weight: user?.weight != null ? String(user.weight) : "",
      bloodType: user?.bloodType ?? undefined,
      gender: user?.gender ?? undefined,
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      submit: () =>
        new Promise<boolean>((resolve) => {
          void handleSubmit(
            (data) => {
              updateUser({
                height: Math.round(Number(data.height.replace(",", "."))),
                weight: Math.round(Number(data.weight.replace(",", "."))),
                bloodType: data.bloodType,
                gender: data.gender,
              });
              resolve(true);
            },
            () => resolve(false),
          )();
        }),
    }),
    [handleSubmit, updateUser],
  );

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
    >
      <YStack gap={22} pt={8}>
        <Text fontSize={18} fontWeight="700" color={palette.black}>
          기본 건강 정보
        </Text>
        <Text fontSize={14} color={palette.icon} lineHeight={20}>
          서비스 맞춤에 사용됩니다. 언제든 프로필에서 수정할 수 있어요.
        </Text>

        <YStack gap={8}>
          <FieldLabel>키 (cm)</FieldLabel>
          <Controller
            control={control}
            name="height"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <>
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="예: 170"
                  bg={palette.gray}
                  borderWidth={1}
                  borderColor={error ? palette.red : palette.dark_gray}
                  color={palette.black}
                  px={14}
                  height={45}
                />
                {error ? (
                  <Text fontSize={12} style={{ color: palette.red }}>
                    {error.message}
                  </Text>
                ) : null}
              </>
            )}
          />
        </YStack>

        <YStack gap={8}>
          <FieldLabel>몸무게 (kg)</FieldLabel>
          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <>
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="예: 65"
                  bg={palette.gray}
                  borderWidth={1}
                  borderColor={error ? palette.red : palette.dark_gray}
                  color={palette.black}
                  px={14}
                  height={45}
                />
                {error ? (
                  <Text fontSize={12} style={{ color: palette.red }}>
                    {error.message}
                  </Text>
                ) : null}
              </>
            )}
          />
        </YStack>

        <YStack gap={10}>
          <FieldLabel>혈액형</FieldLabel>
          <Controller
            control={control}
            name="bloodType"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <XStack gap={8} flexWrap="wrap">
                  {bloodOptions.map((opt) => {
                    const selected = value === opt.value;
                    return (
                      <SelectChip
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        label={opt.label}
                        selected={selected}
                        accessibilityLabel={opt.label}
                      />
                    );
                  })}
                </XStack>
                {error ? (
                  <Text fontSize={12} style={{ color: palette.red }}>
                    {error.message}
                  </Text>
                ) : null}
              </>
            )}
          />
        </YStack>

        <YStack gap={10}>
          <FieldLabel>성별</FieldLabel>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <XStack gap={10}>
                  {genderOptions.map((opt) => {
                    const selected = value === opt.value;
                    return (
                      <SelectChip
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        label={opt.label}
                        selected={selected}
                        accessibilityLabel={opt.label}
                        flex={1}
                      />
                    );
                  })}
                </XStack>
                {error ? (
                  <Text fontSize={12} style={{ color: palette.red }}>
                    {error.message}
                  </Text>
                ) : null}
              </>
            )}
          />
        </YStack>
      </YStack>
    </ScrollView>
  );
});

function FieldLabel({ children }: { children: string }) {
  return (
    <Text fontSize={14} fontWeight="600" color={palette.black}>
      {children}
    </Text>
  );
}

export default Step1;
