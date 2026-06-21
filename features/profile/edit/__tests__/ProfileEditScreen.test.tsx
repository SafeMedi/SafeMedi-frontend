import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { User } from "@/stores/userStore";
import { ProfileEditScreen } from "../ProfileEditScreen";

const mockBack = jest.fn();
const mockMutate = jest.fn();

const mockUser: User = {
  id: "me",
  displayName: "홍길동",
  email: null,
  birthDate: "1990-01-01",
  height: 170,
  weight: 65,
  gender: "female",
  bloodType: "AB-",
  allergies: ["아스피린", "꽃가루"],
  chronicConditions: ["천식"],
  isTutorial: true,
};
let mockActiveUser: User | null = mockUser;

jest.mock("expo-router", () => ({
  router: {
    back: mockBack,
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: User | null }) => unknown) =>
    selector({
      user: mockActiveUser,
    }),
}));

jest.mock("@/api/queries/user", () => ({
  useUpdateUserProfileMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("../components/ProfileEditHeader", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  return {
    ProfileEditHeader: ({ onBack }: { onBack: () => void }) =>
      React.createElement(
        Pressable,
        { onPress: onBack, accessibilityRole: "button", accessibilityLabel: "뒤로가기" },
        React.createElement(Text, null, "헤더"),
      ),
  };
});

jest.mock("../components/ProfileNicknameCard", () => {
  const React = require("react");
  const { TextInput } = require("react-native");

  return {
    ProfileNicknameCard: ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
      React.createElement(TextInput, {
        value,
        onChangeText: onChange,
        placeholder: "닉네임",
      }),
  };
});

jest.mock("../components/ProfileBasicInfoCard", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  return {
    ProfileBasicInfoCard: ({
      gender,
      bloodType,
      rhFactor,
    }: {
      gender: string;
      bloodType: string;
      rhFactor: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, `기본정보:${gender}:${bloodType}:${rhFactor}`),
      ),
  };
});

jest.mock("../components/ProfileTagEditorCard", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ProfileTagEditorCard: ({ title, items }: { title: string; items: string[] }) =>
      React.createElement(Text, null, `${title}:${items.join(",")}`),
  };
});

jest.mock("../components/ProfileEditNoticeCard", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ProfileEditNoticeCard: () => React.createElement(Text, null, "안내문구"),
  };
});

jest.mock("../components/ProfileEditActionBar", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  return {
    ProfileEditActionBar: ({
      onCancel,
      onSubmit,
    }: {
      onCancel: () => void;
      onSubmit: () => void;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(
          Pressable,
          { onPress: onCancel, accessibilityRole: "button", accessibilityLabel: "취소" },
          React.createElement(Text, null, "취소"),
        ),
        React.createElement(
          Pressable,
          { onPress: onSubmit, accessibilityRole: "button", accessibilityLabel: "저장" },
          React.createElement(Text, null, "저장"),
        ),
      ),
  };
});

describe("프로필 수정 화면", () => {
  beforeEach(() => {
    mockActiveUser = mockUser;
    jest.clearAllMocks();
  });

  it("사용자 정보가 없으면 빈 기본값으로 편집 화면을 렌더링한다", () => {
    mockActiveUser = null;

    const { getByDisplayValue } = render(<ProfileEditScreen />);

    expect(getByDisplayValue("")).toBeTruthy();
  });

  it("유저 기본값을 폼에 표시한다", () => {
    const { getByDisplayValue, getByText } = render(<ProfileEditScreen />);

    expect(getByDisplayValue("홍길동")).toBeTruthy();
    expect(getByText("기본정보:female:AB:negative")).toBeTruthy();
    expect(getByText("알러지:아스피린,꽃가루")).toBeTruthy();
    expect(getByText("기저질환:천식")).toBeTruthy();
  });

  it("저장 버튼을 누르면 변환된 payload로 mutate를 호출한다", async () => {
    const { getByLabelText } = render(<ProfileEditScreen />);

    fireEvent.press(getByLabelText("저장"));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          displayName: "홍길동",
          gender: "F",
          bloodType: "AB-",
          diseases: ["천식"],
          allergies: ["N02BA01", "꽃가루"],
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });
  });
});
