import { apiPaths } from "@/api/paths";
import { postSocialLogin } from "../auth";
import { fetchFamilies, fetchFamilyDetail, fetchFamilyManageOverview } from "../family";
import { fetchNotificationSettings, patchNotificationSettings } from "../notification";
import { createPrescriptionByScan } from "../prescription-scan";
import { postTutorialRegistration } from "../tutorial";
import { fetchUserProfile, fetchUserProfileWithAccessToken, patchUserProfile } from "../user";

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPatch = jest.fn();

jest.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    patch: (...args: unknown[]) => mockApiPatch(...args),
  },
}));

describe("api/endpoints core modules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("auth login endpoint를 provider/token payload로 호출한다", async () => {
    const expected = { accessToken: "new-token" };
    mockApiPost.mockReturnValueOnce({ json: jest.fn(async () => expected) });

    const result = await postSocialLogin("kakao", "social-token");

    expect(mockApiPost).toHaveBeenCalledWith(apiPaths.authLogin("kakao"), {
      json: { accessToken: "social-token" },
    });
    expect(result).toEqual(expected);
  });

  it("family endpoints를 각각 호출한다", async () => {
    mockApiGet
      .mockReturnValueOnce({ json: jest.fn(async () => [{ familyId: 1 }]) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ members: [] })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ familyId: 2 })) });

    await fetchFamilies();
    await fetchFamilyManageOverview();
    await fetchFamilyDetail(2);

    expect(mockApiGet).toHaveBeenNthCalledWith(1, apiPaths.families);
    expect(mockApiGet).toHaveBeenNthCalledWith(2, apiPaths.familiesManage);
    expect(mockApiGet).toHaveBeenNthCalledWith(3, apiPaths.family(2));
  });

  it("notification endpoints를 조회/수정 호출한다", async () => {
    mockApiGet.mockReturnValueOnce({ json: jest.fn(async () => ({ isMyReminderOn: true })) });
    mockApiPatch.mockReturnValueOnce({ json: jest.fn(async () => ({ isMyReminderOn: false })) });

    await fetchNotificationSettings();
    await patchNotificationSettings({ isMyReminderOn: false });

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.notificationsSettings);
    expect(mockApiPatch).toHaveBeenCalledWith(apiPaths.notificationsSettings, {
      json: { isMyReminderOn: false },
    });
  });

  it("prescription/tutorial/user endpoints를 호출한다", async () => {
    mockApiPost
      .mockReturnValueOnce({ json: jest.fn(async () => ({ prescriptionId: 1 })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ ok: true })) });
    mockApiGet
      .mockReturnValueOnce({ json: jest.fn(async () => ({ id: "me" })) })
      .mockReturnValueOnce({ json: jest.fn(async () => ({ id: "me" })) });
    mockApiPatch.mockReturnValueOnce({ json: jest.fn(async () => ({ id: "me" })) });

    await createPrescriptionByScan({} as never);
    await postTutorialRegistration({} as never);
    await fetchUserProfile();
    await fetchUserProfileWithAccessToken("token-123");
    await patchUserProfile({} as never);

    expect(mockApiPost).toHaveBeenNthCalledWith(1, apiPaths.prescriptions, { json: {} });
    expect(mockApiPost).toHaveBeenNthCalledWith(2, apiPaths.usersMeTutorial, { json: {} });
    expect(mockApiGet).toHaveBeenNthCalledWith(1, apiPaths.usersMe);
    expect(mockApiGet).toHaveBeenNthCalledWith(2, apiPaths.usersMe, {
      headers: { Authorization: "Bearer token-123" },
    });
    expect(mockApiPatch).toHaveBeenCalledWith(apiPaths.usersMe, { json: {} });
  });
});
