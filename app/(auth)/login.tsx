import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { YStack } from "tamagui";
import { useLoginMutation, useUserProfile } from "@/api/queries/user";
import { queryKeys } from "@/api/query-keys";
import { isUnauthorizedError } from "@/api/error";
import IntroContentImage from "@/assets/images/intro_content.png";
import KakaoButtonImage from "@/assets/images/kakaoLoginButton.png";
import { palette } from "@/constants/design-tokens";
import { useSessionHydrated } from "@/hooks/use-session-hydrated";
import { useSessionStore } from "@/stores/sessionStore";

/** 개발·mock용 소셜 액세스 토큰 (실제 연동 시 카카오 SDK에서 발급) */
const DEV_KAKAO_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_DEV_KAKAO_ACCESS_TOKEN ?? "kakao-dev-access-token";

export default function LoginScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const hydrated = useSessionHydrated();
  const queryClient = useQueryClient();
  const accessToken = useSessionStore((s) => s.accessToken);
  const clearSession = useSessionStore((s) => s.clearSession);
  const {
    data: profile,
    error: profileQueryError,
    isPending: profilePending,
    isError: hasProfileError,
  } = useUserProfile();
  const loginMutation = useLoginMutation();

  useEffect(() => {
    // 네트워크 일시 장애(5xx 등)에서는 세션을 유지하고, 인증 만료(401)일 때만 세션을 비웁니다.
    const isUnauthorized = isUnauthorizedError(profileQueryError);
    if (accessToken && hasProfileError && isUnauthorized && !loginMutation.isPending) {
      clearSession();
      queryClient.removeQueries({ queryKey: queryKeys.user.me });
    }
  }, [accessToken, hasProfileError, profileQueryError, clearSession, queryClient, loginMutation.isPending]);

  const imageSize = 280;
  const imageHalf = imageSize / 2;

  const introImageMarginTop = Math.max(16, windowHeight * 0.44 - imageHalf);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (accessToken && profilePending) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (accessToken && profile) {
    if (profile.isTutorialCompleted) {
      return <Redirect href="/(tabs)/dashboard" />;
    }
    return <Redirect href="/(auth)/tutorial" />;
  }

  const handleLogin = () => {
    loginMutation.mutate({ provider: "kakao", accessToken: DEV_KAKAO_ACCESS_TOKEN });
  };

  return (
    <YStack bg="$backgroundGreen" flex={1} style={{ position: "relative" }}>
      <LinearGradient colors={palette.bg_green_line} style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: "center", width: "100%" }}>
          <ImageBackground
            source={IntroContentImage}
            style={{
              width: imageSize,
              height: imageSize,
              marginTop: introImageMarginTop,
              zIndex: 0,
            }}
          />
          <Pressable
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            accessibilityLabel="카카오 소셜로그인"
            style={{ marginTop: 20 }}
          >
            <Image source={KakaoButtonImage} style={{ width: 183, height: 45 }} />
          </Pressable>
        </View>
      </LinearGradient>
    </YStack>
  );
}
