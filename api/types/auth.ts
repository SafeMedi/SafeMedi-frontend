/** POST /api/v1/auth/login/:provider */
export type SocialLoginResponse = {
  accessToken: string;
  isTutorialCompleted: boolean;
};
