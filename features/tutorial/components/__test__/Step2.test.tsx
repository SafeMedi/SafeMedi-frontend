import { act, fireEvent, render } from "@testing-library/react-native";
import { createRef } from "react";
import "@/tests/test-utils/test-mocks";
import { Step2 } from "@/features/tutorial";
import type { StepHandle } from "@/features/tutorial/types";
import type { User } from "@/stores/userStore";
import { mockUpdateUser, resetMockStore, setMockUser } from "@/tests/test-utils/test-mocks";

const baseUser: User = {
  id: "me",
  displayName: "사용자",
  email: null,
  birthDate: "1999-01-01",
  height: 170,
  weight: 65,
  gender: "male",
  bloodType: "O+",
  allergies: ["페니실린"],
  chronicConditions: [],
  isTutorial: false,
};

describe("튜토리얼 Step2", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("선택 알러지와 직접 입력 알러지를 저장하고 submit이 성공한다", async () => {
    setMockUser(baseUser);
    const ref = createRef<StepHandle>();
    const { getByPlaceholderText, getByLabelText } = render(<Step2 ref={ref} />);

    fireEvent.press(getByLabelText("아스피린"));
    fireEvent.changeText(getByPlaceholderText("선택지에 없는 알러지 입력"), "꽃가루");
    fireEvent.press(getByLabelText("알러지 직접 입력 추가"));

    let submitted = false;
    await act(async () => {
      submitted = (await ref.current?.submit()) ?? false;
    });

    expect(submitted).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({
      allergies: ["페니실린", "아스피린", "꽃가루"],
    });
  });
});
