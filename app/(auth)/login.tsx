import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { Image, ImageBackground, Pressable, useWindowDimensions, View } from "react-native";
import { YStack } from "tamagui";
import IntroContentImage from "@/assets/images/intro_content.png";
import KakaoButtonImage from "@/assets/images/kakaoLoginButton.png";
import { palette } from "@/constants/design-tokens";
import { useUserStore } from "@/stores/userStore";

export default function LoginScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const imageSize = 280;
  const imageHalf = imageSize / 2;

  // 화면 y 높이 중간보다 살짝 높게
  const introImageMarginTop = Math.max(16, windowHeight * 0.44 - imageHalf);

  if (user) {
    if (!user.isTutorial) {
      return <Redirect href="/(auth)/tutorial" />;
    }
    return <Redirect href="/(tabs)/dashboard" />;
  }

  const handleLogin = () => {
    setUser({
      id: "dev-user",
      displayName: "테스트 사용자",
      email: "user@example.com",
      birthDate: null,
      height: null,
      weight: null,
      gender: null,
      bloodType: null,
      allergies: [],
      chronicConditions: [],
      isTutorial: false,
    });
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
