import { fireEvent, render } from "@testing-library/react-native";
import { FamilyMedicationScheduleCard } from "../family-screen/FamilyMedicationScheduleCard";
import { FamilyInviteCard } from "../invite/FamilyInviteCard";
import { FamilyMemberCard } from "../invite/FamilyMemberCard";

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

describe("family cards", () => {
  it("FamilyMedicationScheduleCard는 상태에 따라 완료/대기 뱃지를 표시한다", () => {
    const { getByText, rerender } = render(
      <FamilyMedicationScheduleCard
        schedule={
          { medicineName: "타이레놀", scheduledTime: "08:00", status: "COMPLETED" } as never
        }
      />,
    );
    expect(getByText("완료")).toBeTruthy();

    rerender(
      <FamilyMedicationScheduleCard
        schedule={{ medicineName: "타이레놀", scheduledTime: "08:00", status: "PENDING" } as never}
      />,
    );
    expect(getByText("대기")).toBeTruthy();
  });

  it("FamilyInviteCard는 링크가 없으면 액션 버튼이 비활성화된다", () => {
    const onCopyLink = jest.fn();
    const onShareLink = jest.fn();
    const { getByText } = render(
      <FamilyInviteCard inviteLink=" " onCopyLink={onCopyLink} onShareLink={onShareLink} />,
    );

    fireEvent.press(getByText("링크 복사"));
    fireEvent.press(getByText("공유하기"));
    expect(onCopyLink).not.toHaveBeenCalled();
    expect(onShareLink).not.toHaveBeenCalled();
  });

  it("FamilyInviteCard는 링크가 있으면 액션 버튼이 동작한다", () => {
    const onCopyLink = jest.fn();
    const onShareLink = jest.fn();
    const { getByText } = render(
      <FamilyInviteCard
        inviteLink="https://invite"
        onCopyLink={onCopyLink}
        onShareLink={onShareLink}
      />,
    );

    fireEvent.press(getByText("링크 복사"));
    fireEvent.press(getByText("공유하기"));
    expect(onCopyLink).toHaveBeenCalled();
    expect(onShareLink).toHaveBeenCalled();
  });

  it("FamilyInviteCard는 핸들러가 없어도 링크가 있으면 기본 동작으로 안전하게 처리한다", () => {
    const { getByText } = render(<FamilyInviteCard inviteLink="https://invite" />);

    fireEvent.press(getByText("링크 복사"));
    fireEvent.press(getByText("공유하기"));

    expect(getByText("초대 링크 공유")).toBeTruthy();
  });

  it("FamilyMemberCard는 활성 멤버에만 활성 뱃지를 표시한다", () => {
    const { queryByText, rerender } = render(
      <FamilyMemberCard
        member={{ name: "엄마", relation: "가족", emoji: "😀", isActive: true } as never}
      />,
    );
    expect(queryByText("활성")).toBeTruthy();

    rerender(
      <FamilyMemberCard
        member={{ name: "아빠", relation: "가족", emoji: "😎", isActive: false } as never}
      />,
    );
    expect(queryByText("활성")).toBeNull();
  });
});
