import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { parseApiError } from "@/api/error";
import { useCompleteTutorialMutation, useUserProfile } from "@/api/queries/user";
import Step1 from "@/components/domains/tutorial/step1";
import Step2 from "@/components/domains/tutorial/step2";
import Step3 from "@/components/domains/tutorial/step3";
import Step4 from "@/components/domains/tutorial/step4";
import { PillButton } from "@/components/ui/pill-button";
import { SegmentedStepProgress } from "@/components/ui/segmented-step-progress";
import { palette } from "@/constants/design-tokens";
import { useSessionHydrated } from "@/hooks/use-session-hydrated";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";
import { userToTutorialRegistrationBody } from "@/utils/user-mapper";

export type StepHandle = {
  submit: () => Promise<boolean>;
};

const TOTAL_STEPS = 4;

export default function TutorialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hydrated = useSessionHydrated();
  const accessToken = useSessionStore((s) => s.accessToken);
  const { data: profile, isPending: profilePending } = useUserProfile();
  const user = useUserStore((s) => s.user);
  const completeTutorial = useCompleteTutorialMutation();

  const [step, setStep] = useState(0);
  const step1Ref = useRef<StepHandle>(null);
  const step2Ref = useRef<StepHandle>(null);
  const step3Ref = useRef<StepHandle>(null);
  const step4Ref = useRef<StepHandle>(null);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!accessToken) {
    return <Redirect href="/(auth)/login" />;
  }

  if (profilePending || !profile) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (profile.isTutorialCompleted) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleComplete = async () => {
    const latest = useUserStore.getState().user;
    if (!latest) return;
    try {
      await completeTutorial.mutateAsync(userToTutorialRegistrationBody(latest));
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      const parsedError = await parseApiError(error);
      Alert.alert("오류", parsedError.message);
    }
  };

  const goNext = async () => {
    const stepRefs = [step1Ref, step2Ref, step3Ref, step4Ref];
    const submitFn = stepRefs[step]?.current?.submit;
    const ok = submitFn ? await submitFn() : false;

    if (!ok) return;

    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      await handleComplete();
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
            {step === 2 && <Step3 ref={step3Ref} />}
            {step === 3 && <Step4 ref={step4Ref} />}
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
              <Text fontSize={14} fontWeight="600" color={palette.black}>
                이전
              </Text>
            </PillButton>
            <PillButton
              variant="solid"
              accessibilityLabel={step === TOTAL_STEPS - 1 ? "튜토리얼 완료" : "다음 단계"}
              onPress={() => void goNext()}
              disabled={completeTutorial.isPending}
              rightElement={<Ionicons name="chevron-forward" size={16} color="#FFFFFF" />}
            >
              <Text fontSize={14} fontWeight="600" color="#FFFFFF">
                {completeTutorial.isPending
                  ? "저장 중…"
                  : step === TOTAL_STEPS - 1
                    ? "시작하기"
                    : "다음"}
              </Text>
            </PillButton>
          </XStack>
        </YStack>
      </LinearGradient>
    </YStack>
  );
}
