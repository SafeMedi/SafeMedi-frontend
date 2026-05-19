import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { PillButton } from "../PillButton";

describe("PillButton", () => {
  it("solid 버튼 클릭 시 onPress를 호출한다", () => {
    const handlePress = jest.fn();
    const { getByLabelText } = render(
      <PillButton variant="solid" accessibilityLabel="저장 버튼" onPress={handlePress}>
        <Text>저장</Text>
      </PillButton>,
    );

    fireEvent.press(getByLabelText("저장 버튼"));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it("disabled outline 버튼은 클릭되지 않는다", () => {
    const handlePress = jest.fn();
    const { getByLabelText } = render(
      <PillButton variant="outline" accessibilityLabel="취소 버튼" disabled onPress={handlePress}>
        <Text>취소</Text>
      </PillButton>,
    );

    fireEvent.press(getByLabelText("취소 버튼"));
    expect(handlePress).not.toHaveBeenCalled();
  });

  it("좌우 엘리먼트를 함께 렌더링한다", () => {
    const { getByText } = render(
      <PillButton
        variant="outline"
        onPress={() => {}}
        leftElement={<Text>왼쪽</Text>}
        rightElement={<Text>오른쪽</Text>}
      >
        <Text>본문</Text>
      </PillButton>,
    );

    expect(getByText("왼쪽")).toBeTruthy();
    expect(getByText("본문")).toBeTruthy();
    expect(getByText("오른쪽")).toBeTruthy();
  });
});
