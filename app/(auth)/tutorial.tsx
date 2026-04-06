import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";
import { PillButton } from "@/components/ui/pill-button";
import { SegmentedStepProgress } from "@/components/ui/segmented-step-progress";
import { palette } from "@/constants/design-tokens";
import { useUserStore } from "@/stores/userStore";
import Step1, { type Step1Handle } from "./tutorial/step1";
import Step2, { type Step2Handle } from "./tutorial/step2";

const TOTAL_STEPS = 4;

export default function TutorialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const [step, setStep] = useState(0);
  const step1Ref = useRef<Step1Handle>(null);
  const step2Ref = useRef<Step2Handle>(null);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.isTutorial) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  const handleComplete = () => {
    updateUser({ isTutorial: true });
    router.replace("/(tabs)/dashboard");
  };

  const goNext = async () => {
    if (step === 0) {
      const ok = await step1Ref.current?.submit();
      if (!ok) return;
    }
    if (step === 1) {
      const ok = await step2Ref.current?.submit();
      if (!ok) return;
    }
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const isFirstStep = step === 0;

  return (
    <YStack flex={1}>
      <LinearGradient colors={palette.bg_pink_line} style={{ flex: 1 }}>
        <YStack flex={1} pt={insets.top + 12}>
          <XStack px={20}>
            <SegmentedStepProgress currentIndex={step} totalSteps={TOTAL_STEPS} />
          </XStack>

          <YStack flex={1}>
            {step === 0 && <Step1 ref={step1Ref} />}
            {step === 1 && <Step2 ref={step2Ref} />}
          </YStack>

          <XStack
            bg="$background"
            gap={12}
            px={20}
            pt={12}
            pb={insets.bottom + 16}
            width="100%"
            items="stretch"
          >
            <PillButton
              variant="outline"
              accessibilityLabel="이전 단계"
              disabled={isFirstStep}
              onPress={goPrev}
            >
              <Text fontSize={14} fontWeight="600" color={palette.text_black}>
                이전
              </Text>
            </PillButton>
            <PillButton
              variant="solid"
              accessibilityLabel={step === TOTAL_STEPS - 1 ? "튜토리얼 완료" : "다음 단계"}
              onPress={goNext}
              rightElement={<Ionicons name="chevron-forward" size={16} color="#FFFFFF" />}
            >
              <Text fontSize={14} fontWeight="600" color="#FFFFFF">
                다음
              </Text>
            </PillButton>
          </XStack>
        </YStack>
      </LinearGradient>
    </YStack>
  );
}
