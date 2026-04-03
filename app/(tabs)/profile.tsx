import { Button, Text, YStack } from "tamagui";

import { palette } from "@/constants/design-tokens";
import { useUserStore } from "@/stores/userStore";

export default function ProfileScreen() {
  const clearUser = useUserStore((s) => s.clearUser);

  return (
    <YStack flex={1} p="$4" bg="$background" gap="$4">
      <Text fontSize={20} fontWeight="700" color={palette.text}>
        프로필
      </Text>
      <Button variant="outlined" borderColor={palette.icon} onPress={clearUser}>
        로그아웃
      </Button>
    </YStack>
  );
}
