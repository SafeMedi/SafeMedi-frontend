import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { ImageBackground, useWindowDimensions, View } from "react-native";
import { Button, Text, YStack } from "tamagui";
import IntroContentImage from "@/assets/images/intro_content.png";
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
          <Button
            mt="$4"
            width={imageSize}
            bg="$background"
            onPress={handleLogin}
          >
            <Text color="$backgroundGreen" fontWeight="700" fontSize={16}>
              로그인
            </Text>
          </Button>
        </View>
      </LinearGradient>
    </YStack>
  );
}
