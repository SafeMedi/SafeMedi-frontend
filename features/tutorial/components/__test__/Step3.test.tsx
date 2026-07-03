import { act, fireEvent, render } from "@testing-library/react-native";
import { createRef } from "react";
import "@/tests/test-utils/test-mocks";
import { Step3 } from "@/features/tutorial/components/Step3";
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

  it("선택 가능한 기저질환만 저장하고 submit이 성공한다", async () => {
    setMockUser({ ...baseUser, chronicConditions: ["천식", "편두통"] });
    const ref = createRef<StepHandle>();
    const { getByLabelText, queryByPlaceholderText } = render(<Step3 ref={ref} />);

    fireEvent.press(getByLabelText("고혈압"));

    let submitted = false;
    await act(async () => {
      submitted = (await ref.current?.submit()) ?? false;
    });

    expect(submitted).toBe(true);
    expect(queryByPlaceholderText("선택지에 없는 기저질환 입력")).toBeNull();
    expect(mockUpdateUser).toHaveBeenCalledWith({
      chronicConditions: ["천식", "고혈압"],
    });
  });
});
