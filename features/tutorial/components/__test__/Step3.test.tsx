import { act, fireEvent, render } from "@testing-library/react-native";
import { createRef } from "react";
import "@/tests/test-utils/test-mocks";
import { Step3 } from "@/features/tutorial";
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
  allergies: [],
  chronicConditions: ["천식"],
  isTutorial: false,
};

describe("튜토리얼 Step3", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("선택 기저질환과 직접 입력 기저질환을 저장하고 submit이 성공한다", async () => {
    setMockUser(baseUser);
    const ref = createRef<StepHandle>();
    const { getByLabelText, getByPlaceholderText } = render(<Step3 ref={ref} />);

    fireEvent.press(getByLabelText("고혈압"));
    fireEvent.changeText(getByPlaceholderText("선택지에 없는 기저질환 입력"), "편두통");
    fireEvent.press(getByLabelText("기저질환 직접 입력 추가"));

    let submitted = false;
    await act(async () => {
      submitted = (await ref.current?.submit()) ?? false;
    });

    expect(submitted).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({
      chronicConditions: ["천식", "고혈압", "편두통"],
    });
  });
});
