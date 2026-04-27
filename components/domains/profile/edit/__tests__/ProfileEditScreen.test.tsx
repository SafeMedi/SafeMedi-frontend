import { fireEvent, render, waitFor } from "@testing-library/react-native";
import ProfileEditScreen from "@/app/(detail)/profile/edit";
import type { User } from "@/stores/userStore";

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
      user: mockUser,
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

jest.mock("@/components/domains/profile/edit", () => {
  const React = require("react");
  const { Pressable, Text, TextInput, View } = require("react-native");

  return {
    ProfileEditHeader: ({ onBack }: { onBack: () => void }) =>
      React.createElement(
        Pressable,
        { onPress: onBack, accessibilityRole: "button", accessibilityLabel: "뒤로가기" },
        React.createElement(Text, null, "헤더"),
      ),
    ProfileNicknameCard: ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
      React.createElement(TextInput, {
        value,
        onChangeText: onChange,
        placeholder: "닉네임",
      }),
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
    ProfileTagEditorCard: ({ title, items }: { title: string; items: string[] }) =>
      React.createElement(Text, null, `${title}:${items.join(",")}`),
    ProfileEditNoticeCard: () => React.createElement(Text, null, "안내문구"),
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
    jest.clearAllMocks();
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
