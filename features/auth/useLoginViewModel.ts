import { login } from "@react-native-seoul/kakao-login";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { parseApiError } from "@/api/error";
import { useLoginMutation } from "@/api/queries/user";

export interface LoginViewModel {
  isLoggingIn: boolean;
  handleKakaoLogin: () => Promise<void>;
}

function isKakaoLoginCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("cancel") || message.includes("취소");
}

export function useLoginViewModel(): LoginViewModel {
  const loginMutation = useLoginMutation();
  const [isKakaoLoggingIn, setIsKakaoLoggingIn] = useState(false);

  const handleKakaoLogin = useCallback(async () => {
    if (isKakaoLoggingIn || loginMutation.isPending) {
      return;
    }

    setIsKakaoLoggingIn(true);
    try {
      const kakaoToken = await login();
      await loginMutation.mutateAsync({
        provider: "kakao",
        accessToken: kakaoToken.accessToken,
      });
    } catch (error) {
      if (isKakaoLoginCancelled(error)) {
        return;
      }

      const parsedError = await parseApiError(error);
      Alert.alert("로그인 실패", parsedError.message);
    } finally {
      setIsKakaoLoggingIn(false);
    }
  }, [isKakaoLoggingIn, loginMutation]);

  return {
    isLoggingIn: isKakaoLoggingIn || loginMutation.isPending,
    handleKakaoLogin,
  };
}
