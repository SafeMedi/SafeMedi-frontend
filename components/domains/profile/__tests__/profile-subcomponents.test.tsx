import { fireEvent, render } from "@testing-library/react-native";
import { ProfileEditActionBar } from "../edit/ProfileEditActionBar";
import { AppInfoSection } from "../view/AppInfoSection";
import { FamilyProfileItem } from "../view/FamilyProfileItem";
import { FamilyProfileSection } from "../view/FamilyProfileSection";
import { LogoutButton } from "../view/LogoutButton";
import { UserHeroCard } from "../view/UserHeroCard";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

describe("profile subcomponents", () => {
  it("ProfileEditActionBar는 취소/저장 이벤트를 전달한다", () => {
    const onCancel = jest.fn();
    const onSubmit = jest.fn();
    const { getByText, rerender } = render(
      <ProfileEditActionBar onCancel={onCancel} onSubmit={onSubmit} />,
    );

    fireEvent.press(getByText("취소"));
    fireEvent.press(getByText("저장하기"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(<ProfileEditActionBar isSubmitting />);
    expect(getByText("저장 중...")).toBeTruthy();
  });

  it("AppInfoSection은 리스트 항목과 trailing text를 렌더링한다", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AppInfoSection
        items={[{ id: "version", label: "앱 버전", trailingText: "1.0.0", onPress }]}
      />,
    );

    expect(getByText("앱 버전")).toBeTruthy();
    expect(getByText("1.0.0")).toBeTruthy();
    fireEvent.press(getByText("앱 버전"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("FamilyProfileItem은 클릭 가능 여부와 활성 라벨을 반영한다", () => {
    const onPress = jest.fn();
    const { getByText, rerender } = render(
      <FamilyProfileItem
        name="홍길동"
        isActive
        avatarGradient={["#000", "#111"]}
        onPress={onPress}
      />,
    );
    expect(getByText("현재 활성")).toBeTruthy();
    fireEvent.press(getByText("홍길동"));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(
      <FamilyProfileItem name="김철수" isActive={false} avatarGradient={["#000", "#111"]} />,
    );
    expect(getByText("김철수")).toBeTruthy();
  });

  it("FamilyProfileSection은 추가/선택 이벤트를 전달한다", () => {
    const onAddFamily = jest.fn();
    const onSelectProfile = jest.fn();
    const profiles = [
      { id: "me", name: "본인", isActive: true, avatarGradient: ["#000", "#111"] },
      { id: "2", name: "가족", isActive: false, avatarGradient: ["#111", "#222"] },
    ];
    const { getByText } = render(
      <FamilyProfileSection
        profiles={profiles as never}
        onAddFamily={onAddFamily}
        onSelectProfile={onSelectProfile}
      />,
    );

    fireEvent.press(getByText("+ 가족 추가"));
    fireEvent.press(getByText("가족"));
    expect(onAddFamily).toHaveBeenCalledTimes(1);
    expect(onSelectProfile).toHaveBeenCalledWith(profiles[1]);
  });

  it("LogoutButton/UserHeroCard는 클릭 이벤트를 전달한다", () => {
    const onLogout = jest.fn();
    const onPressHero = jest.fn();
    const heroProps: { name: string; role: string; onPress: () => void } = {
      name: "홍길동",
      role: "주 사용자",
      onPress: onPressHero,
    };
    const { getByText } = render(
      <>
        <LogoutButton onPress={onLogout} />
        <UserHeroCard {...heroProps} />
      </>,
    );

    fireEvent.press(getByText("로그아웃"));
    fireEvent.press(getByText("홍길동"));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onPressHero).toHaveBeenCalledTimes(1);
  });
});
