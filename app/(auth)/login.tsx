import { Button, Text, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";
import { useUserStore } from "@/stores/userStore";

export default function LoginScreen() {
  const setUser = useUserStore((s) => s.setUser);

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
    <YStack flex={1} p="$4" bg={palette.background} style={{ justifyContent: "center" }}>
      <Text fontSize={24} fontWeight="700" color={palette.text} mb="$3">
        로그인
      </Text>
      <Text fontSize={15} color={palette.icon} mb="$6">
        실제 로그인 API 연동 시 이 화면에서 인증을 처리합니다.
      </Text>
      <Button size="$4" bg={palette.color_green} onPress={handleLogin}>
        로그인하기
      </Button>
    </YStack>
  );
}
