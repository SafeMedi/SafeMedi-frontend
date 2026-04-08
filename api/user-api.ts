import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type { SocialLoginResponse } from "@/api/types/auth";
import type { TutorialRegistrationBody, TutorialRegistrationResponse } from "@/api/types/tutorial";
import type { UserProfile } from "@/api/types/user";

export async function fetchUserProfile(): Promise<UserProfile> {
  return api.get(apiPaths.usersMe).json<UserProfile>();
}

/** 로그인 직후 등 스토어 반영 전에도 동일 JWT로 프로필을 가져올 때 사용 (Authorization은 요청 옵션으로만 설정). */
export async function fetchUserProfileWithAccessToken(accessToken: string): Promise<UserProfile> {
  return api
    .get(apiPaths.usersMe, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .json<UserProfile>();
}

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

export async function postTutorialRegistration(
  body: TutorialRegistrationBody,
): Promise<TutorialRegistrationResponse> {
  return api
    .post(apiPaths.usersMeTutorial, {
      json: body,
    })
    .json<TutorialRegistrationResponse>();
}
