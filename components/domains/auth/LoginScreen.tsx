import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { Image, ImageBackground, Pressable, useWindowDimensions, View } from "react-native";
import { YStack } from "tamagui";

import IntroContentImage from "@/assets/images/intro_content.png";
import KakaoButtonImage from "@/assets/images/kakaoLoginButton.png";
import { AuthGateView } from "@/components/AuthGateView";
import { palette } from "@/constants/design-tokens";
import { useAuthRouteState } from "@/hooks/use-auth-route-state";

import { useLoginViewModel } from "./useLoginViewModel";

export function LoginScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const authState = useAuthRouteState();
  const { isLoggingIn, handleKakaoLogin } = useLoginViewModel();

  const imageSize = 280;
  const imageHalf = imageSize / 2;
  const introImageMarginTop = Math.max(16, windowHeight * 0.44 - imageHalf);

  if (authState.kind === "loading") {
    return <AuthGateView kind="loading" />;
  }

  if (authState.kind === "error") {
    return <AuthGateView kind="error" onRetry={authState.retry} />;
  }

  if (authState.kind === "redirect" && authState.href !== "/(auth)/login") {
    return <Redirect href={authState.href} />;
  }

  const handleLogin = () => {
    void handleKakaoLogin();
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
            disabled={isLoggingIn}
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
