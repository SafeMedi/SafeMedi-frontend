import { useQueryClient } from "@tanstack/react-query";
import { Button, Text, YStack } from "tamagui";

import { queryKeys } from "@/api/query-keys";
import { palette } from "@/constants/design-tokens";
import { useSessionStore } from "@/stores/sessionStore";
import { useUserStore } from "@/stores/userStore";

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((s) => s.clearSession);
  const clearUser = useUserStore((s) => s.clearUser);

  const handleLogout = () => {
    clearSession();
    clearUser();
    queryClient.removeQueries({ queryKey: queryKeys.user.me });
  };

  return (
    <YStack flex={1} p="$4" gap="$4">
      <Text fontSize={20} fontWeight="700" color={palette.text}>
        프로필
      </Text>
      <Button variant="outlined" borderColor={palette.icon} onPress={handleLogout}>
        로그아웃
      </Button>
    </YStack>
  );
}
