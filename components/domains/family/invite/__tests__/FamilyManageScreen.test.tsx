import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Alert, Share } from "react-native";
import type { FamilyMember, PendingFamilyInvite } from "../../types";
import { FamilyManageScreen } from "../FamilyManageScreen";

interface MockFamilyInviteCardProps {
  readonly inviteLink: string;
  readonly onCopyLink?: () => void | Promise<void>;
  readonly onShareLink?: () => void | Promise<void>;
}

interface MockFamilyManageHeaderProps {
  readonly onBack?: () => void;
}

interface MockFamilyMembersSectionProps {
  readonly members: readonly FamilyMember[];
}

interface MockPendingInvitesSectionProps {
  readonly invites: readonly PendingFamilyInvite[];
}

type MockFamilyManageOverviewData = {
  readonly inviteLink: string;
  readonly members: readonly FamilyMember[];
  readonly pendingInvites: readonly PendingFamilyInvite[];
};

const mockUseFamilyManageOverview = jest.fn<
  {
    readonly data?: MockFamilyManageOverviewData;
  },
  []
>();

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
}));

jest.mock("@/api/queries/family", () => ({
  useFamilyManageOverview: () => mockUseFamilyManageOverview(),
}));

jest.mock("../FamilyFeatureBanner", () => ({
  FamilyFeatureBanner: () => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, "패밀리 배너");
  },
}));

jest.mock("../FamilyManageHeader", () => ({
  FamilyManageHeader: ({ onBack }: MockFamilyManageHeaderProps) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");
    return React.createElement(
      Pressable,
      { onPress: onBack, accessibilityRole: "button", accessibilityLabel: "가족관리 뒤로가기" },
      React.createElement(Text, null, "가족 관리 헤더"),
    );
  },
}));

jest.mock("../FamilyInviteCard", () => ({
  FamilyInviteCard: ({ inviteLink, onCopyLink, onShareLink }: MockFamilyInviteCardProps) => {
    const React = require("react");
    const { Pressable, Text, View } = require("react-native");
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, inviteLink),
      React.createElement(
        Pressable,
        { onPress: onCopyLink, accessibilityRole: "button", accessibilityLabel: "링크 복사" },
        React.createElement(Text, null, "복사"),
      ),
      React.createElement(
        Pressable,
        { onPress: onShareLink, accessibilityRole: "button", accessibilityLabel: "링크 공유" },
        React.createElement(Text, null, "공유"),
      ),
    );
  },
}));

jest.mock("../FamilyMembersSection", () => ({
  FamilyMembersSection: ({ members }: MockFamilyMembersSectionProps) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, `구성원:${members.length}`);
  },
}));

jest.mock("../PendingInvitesSection", () => ({
  PendingInvitesSection: ({ invites }: MockPendingInvitesSectionProps) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, `대기초대:${invites.length}`);
  },
}));

describe("FamilyManageScreen", () => {
  const mockAlert = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
  const mockShare = jest.spyOn(Share, "share");
  const mockSetStringAsync = Clipboard.setStringAsync as jest.MockedFunction<
    typeof Clipboard.setStringAsync
  >;
  const mockRouterBack = router.back as jest.MockedFunction<typeof router.back>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFamilyManageOverview.mockReturnValue({
      data: {
        inviteLink: "https://safemedi.app/invite/abc",
        members: [
          {
            id: "1",
            name: "홍길동",
            relation: "아버지",
            emoji: "👨",
            isActive: true,
          },
        ],
        pendingInvites: [
          {
            id: "p-1",
            relation: "어머니",
            email: "mother@example.com",
            invitedAt: "2026-04-30T00:00:00.000Z",
          },
        ],
      },
    });
    mockShare.mockResolvedValue({ action: "sharedAction" });
    mockSetStringAsync.mockResolvedValue(true);
  });

  it("조회 데이터가 화면에 반영된다", () => {
    const { getByText } = render(<FamilyManageScreen />);

    expect(getByText("패밀리 배너")).toBeTruthy();
    expect(getByText("https://safemedi.app/invite/abc")).toBeTruthy();
    expect(getByText("구성원:1")).toBeTruthy();
    expect(getByText("대기초대:1")).toBeTruthy();
  });

  it("링크 복사 버튼 클릭 시 클립보드 복사 후 성공 알림을 띄운다", async () => {
    const { getByLabelText } = render(<FamilyManageScreen />);

    fireEvent.press(getByLabelText("링크 복사"));

    await waitFor(() => {
      expect(mockSetStringAsync).toHaveBeenCalledWith("https://safemedi.app/invite/abc");
    });
    expect(mockAlert).toHaveBeenCalledWith("복사 완료", "초대 링크를 클립보드에 복사했어요.");
  });

  it("공유 버튼 클릭 시 공유 시트를 연다", async () => {
    const { getByLabelText } = render(<FamilyManageScreen />);

    fireEvent.press(getByLabelText("링크 공유"));

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        message: "https://safemedi.app/invite/abc",
        url: "https://safemedi.app/invite/abc",
      });
    });
  });

  it("뒤로가기 버튼 클릭 시 라우터 back을 호출한다", () => {
    const { getByLabelText } = render(<FamilyManageScreen />);

    fireEvent.press(getByLabelText("가족관리 뒤로가기"));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("초대 링크가 비어 있으면 복사/공유를 호출하지 않는다", async () => {
    mockUseFamilyManageOverview.mockReturnValue({
      data: {
        inviteLink: "",
        members: [],
        pendingInvites: [],
      },
    });

    const { getByLabelText } = render(<FamilyManageScreen />);
    fireEvent.press(getByLabelText("링크 복사"));
    fireEvent.press(getByLabelText("링크 공유"));

    await waitFor(() => {
      expect(mockSetStringAsync).not.toHaveBeenCalled();
      expect(mockShare).not.toHaveBeenCalled();
    });
  });
});
