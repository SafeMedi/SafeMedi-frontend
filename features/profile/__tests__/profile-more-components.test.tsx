import { fireEvent, render } from "@testing-library/react-native";
import {
  ProfileBasicInfoCard,
  ProfileEditHeader,
  ProfileEditNoticeCard,
  ProfileNicknameCard,
  ProfileTagEditorCard,
} from "@/features/profile/edit";
import { HealthInfoCard, HealthInfoSection, ProfilePageHeader } from "@/features/profile/view";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    XStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

jest.mock("@/components/ui/SelectChip", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    SelectChip: ({ label, onPress }: { label: string; onPress: () => void }) =>
      React.createElement(Pressable, { onPress }, React.createElement(Text, {}, label)),
  };
});

describe("profile more components", () => {
  it("ProfileEditHeader/ProfileEditNoticeCard 렌더링", () => {
    const onBack = jest.fn();
    const { getByText } = render(
      <>
        <ProfileEditHeader onBack={onBack} />
        <ProfileEditNoticeCard />
      </>,
    );

    expect(getByText("프로필 수정")).toBeTruthy();
    expect(getByText("주의사항")).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();
  });

  it("ProfileNicknameCard 입력 변경 이벤트 전달", () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <ProfileNicknameCard value="홍길동" onChange={onChange} />,
    );

    fireEvent.changeText(getByPlaceholderText("닉네임 입력"), "김철수");
    expect(onChange).toHaveBeenCalledWith("김철수");
  });

  it("ProfileBasicInfoCard 칩 선택 이벤트 전달", () => {
    const onGenderChange = jest.fn();
    const onBloodTypeChange = jest.fn();
    const onRhFactorChange = jest.fn();
    const { getByText } = render(
      <ProfileBasicInfoCard
        gender="female"
        bloodType="A"
        rhFactor="positive"
        onGenderChange={onGenderChange}
        onBloodTypeChange={onBloodTypeChange}
        onRhFactorChange={onRhFactorChange}
      />,
    );

    fireEvent.press(getByText("남성"));
    fireEvent.press(getByText("B형"));
    fireEvent.press(getByText("Rh-"));
    expect(onGenderChange).toHaveBeenCalled();
    expect(onBloodTypeChange).toHaveBeenCalled();
    expect(onRhFactorChange).toHaveBeenCalled();
  });

  it("ProfileTagEditorCard 입력/추가/삭제 이벤트 전달", () => {
    const onInputChange = jest.fn();
    const onAddItem = jest.fn();
    const onRemoveItem = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <ProfileTagEditorCard
        variant="allergy"
        title="알러지"
        items={["꽃가루"]}
        inputValue="견과류"
        inputPlaceholder="알러지를 입력하세요"
        onInputChange={onInputChange}
        onAddItem={onAddItem}
        onRemoveItem={onRemoveItem}
      />,
    );

    fireEvent.changeText(getByPlaceholderText("알러지를 입력하세요"), "해산물");
    expect(onInputChange).toHaveBeenCalledWith("해산물");

    fireEvent(getByPlaceholderText("알러지를 입력하세요"), "submitEditing");
    expect(onAddItem).toHaveBeenCalledWith("견과류");

    fireEvent.press(getByText("+ 설파제"));
    expect(onAddItem).toHaveBeenCalled();
    expect(onRemoveItem).not.toHaveBeenCalled();
  });

  it("HealthInfoCard/HealthInfoSection/ProfilePageHeader 렌더링 및 이벤트 전달", () => {
    const onEdit = jest.fn();
    const onDetailPress = jest.fn();
    const { getByText, getAllByText, getByLabelText } = render(
      <>
        <HealthInfoCard
          variant="allergy"
          icon={null}
          title="알러지"
          items={["꽃가루"]}
          onEdit={onEdit}
        />
        <HealthInfoSection
          allergies={["꽃가루"]}
          chronicConditions={["천식"]}
          onDetailPress={onDetailPress}
        />
        <ProfilePageHeader />
      </>,
    );

    fireEvent.press(getAllByText("편집")[0]);
    fireEvent.press(getByLabelText("건강 정보 상세보기"));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDetailPress).toHaveBeenCalledTimes(1);
    expect(getByText("프로필")).toBeTruthy();
  });
});
