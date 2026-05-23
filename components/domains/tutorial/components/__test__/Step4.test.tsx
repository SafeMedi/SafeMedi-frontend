import { act, fireEvent, render } from "@testing-library/react-native";
import { createRef } from "react";
import "@/tests/test-utils/test-mocks";
import { Step4 } from "@/components/domains/tutorial";
import type { StepHandle } from "@/components/domains/tutorial/types";

describe("튜토리얼 Step4", () => {
  it("화면이 렌더링되고 submit이 성공한다", async () => {
    const ref = createRef<StepHandle>();
    const { getByText, getByLabelText } = render(<Step4 ref={ref} />);

    expect(getByText("가족 관리")).toBeTruthy();
    fireEvent.press(getByLabelText("가족 구성원 추가"));

    let submitted = false;
    await act(async () => {
      submitted = (await ref.current?.submit()) ?? false;
    });

    expect(submitted).toBe(true);
  });
});
