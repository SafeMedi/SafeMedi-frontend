import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { Image, Pressable, useWindowDimensions, View } from "react-native";
import { YStack } from "tamagui";

import IntroContentImage from "@/assets/images/introContent.png";
import KakaoButtonImage from "@/assets/images/kakaoLoginButton.png";
import { AuthGateView } from "@/components/AuthGateView";
import { palette } from "@/constants/design-tokens";
import { useAuthRouteState } from "@/hooks/use-auth-route-state";

import { useLoginViewModel } from "./useLoginViewModel";

const introImageSource = Image.resolveAssetSource(IntroContentImage);

function getIntroImageLayout(windowWidth: number) {
  const scale =
    introImageSource.scale && introImageSource.scale > 1
      ? introImageSource.scale
      : introImageSource.width > 400
        ? 2
        : 1;
  const logicalWidth = introImageSource.width / scale;
  const aspectRatio = introImageSource.width / introImageSource.height;
  const displayWidth = Math.min(windowWidth - 32, logicalWidth);
  const displayHeight = displayWidth / aspectRatio;

  return { displayWidth, displayHeight };
}

export function LoginScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const authState = useAuthRouteState();
  const { isLoggingIn, handleKakaoLogin } = useLoginViewModel();

  const { displayWidth: introDisplayWidth, displayHeight: introDisplayHeight } =
    getIntroImageLayout(windowWidth);
  const introImageMarginTop = Math.max(16, windowHeight * 0.44 - introDisplayHeight / 2);

  if (authState.kind === "loading") {
    return <AuthGateView kind="loading" />;
  }

  if (authState.kind === "error") {
    return <AuthGateView kind="error" onRetry={authState.retry} onLogout={authState.logout} />;
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
          <Image
            source={IntroContentImage}
            resizeMode="contain"
            style={{
              width: introDisplayWidth,
              height: introDisplayHeight,
              marginTop: introImageMarginTop,
            }}
          />
          <Pressable
            onPress={handleLogin}
            disabled={isLoggingIn}
            accessibilityLabel="카카오 소셜로그인"
            style={{ marginTop: -20 }}
          >
            <Image source={KakaoButtonImage} style={{ width: 183, height: 45 }} />
          </Pressable>
        </View>
      </LinearGradient>
    </YStack>
  );
}
