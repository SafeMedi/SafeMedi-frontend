import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { SocialLoginResponse } from "@/api/types/auth";

export async function postSocialLogin(
  provider: "kakao" | "naver",
  accessToken: string,
): Promise<SocialLoginResponse> {
  return api
    .post(apiPaths.authLogin(provider), {
      json: { accessToken },
    })
    .json<SocialLoginResponse>();
}
