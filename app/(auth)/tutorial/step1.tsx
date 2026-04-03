import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useImperativeHandle } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, TextInput } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import {
  type TutorialStep1FormValues,
  tutorialStep1Schema,
} from "@/app/(auth)/tutorial/schema";
import { palette } from "@/constants/design-tokens";
import { bloodOptions, genderOptions } from "@/constants/health-profile-options";
import { useUserStore } from "@/stores/userStore";

const BORDER = "#E5E7EB";

export type Step1Handle = {
  submit: () => Promise<boolean>;
};

const Step1 = forwardRef<Step1Handle>(function Step1(_props, ref) {
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

  useImperativeHandle(ref, () => ({
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
  }));

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
    >
      <YStack gap={22} pt={8}>
        <Text fontSize={18} fontWeight="700" color={palette.text_black}>
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
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="예: 170"
                  placeholderTextColor={palette.icon}
                  style={{
                    borderWidth: 1,
                    borderColor: error ? "#DC2626" : BORDER,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: palette.text_black,
                  }}
                />
                {error ? (
                  <Text fontSize={12} style={{ color: "#DC2626" }}>
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
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="예: 65"
                  placeholderTextColor={palette.icon}
                  style={{
                    borderWidth: 1,
                    borderColor: error ? "#DC2626" : BORDER,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: palette.text_black,
                  }}
                />
                {error ? (
                  <Text fontSize={12} style={{ color: "#DC2626" }}>
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
                      <Pressable
                        key={opt.value}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={opt.label}
                        onPress={() => onChange(opt.value)}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 16,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: selected ? palette.color_green : BORDER,
                          backgroundColor: selected ? palette.color_green : "rgba(255,255,255,0.9)",
                        }}
                      >
                        <Text
                          fontSize={14}
                          fontWeight="600"
                          style={{ color: selected ? "#FFFFFF" : palette.text_black }}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </XStack>
                {error ? (
                  <Text fontSize={12} style={{ color: "#DC2626" }}>
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
                      <Pressable
                        key={opt.value}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={opt.label}
                        onPress={() => onChange(opt.value)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          paddingHorizontal: 16,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: selected ? palette.color_green : BORDER,
                          backgroundColor: selected ? palette.color_green : "rgba(255,255,255,0.9)",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          fontSize={14}
                          fontWeight="600"
                          style={{ color: selected ? "#FFFFFF" : palette.text_black }}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </XStack>
                {error ? (
                  <Text fontSize={12} style={{ color: "#DC2626" }}>
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
    <Text fontSize={14} fontWeight="600" color={palette.text_black}>
      {children}
    </Text>
  );
}

export default Step1;
