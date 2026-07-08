import { act, fireEvent, render } from "@testing-library/react-native";
import { createRef } from "react";
import "@/tests/test-utils/test-mocks";
import { Step2 } from "@/features/tutorial/components/Step2";
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

const mockUseSearchDrugsQuery = jest.fn();

jest.mock("@/api/queries/drugs", () => ({
  useSearchDrugsQuery: (...args: unknown[]) => mockUseSearchDrugsQuery(...args),
}));

describe("튜토리얼 Step2", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    resetMockStore();
    mockUseSearchDrugsQuery.mockReturnValue({
      items: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("선택 알러지와 검색 선택 알러지를 저장하고 submit이 성공한다", async () => {
    const searchedDrug = {
      drugCode: "D01",
      atcCode: "J01CA04",
      drugName: "아목시실린캡슐",
      company: "제약사",
    };
    mockUseSearchDrugsQuery.mockReturnValue({
      items: [searchedDrug],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    });
    setMockUser(baseUser);
    const ref = createRef<StepHandle>();
    const { getByPlaceholderText, getByLabelText } = render(<Step2 ref={ref} />);

    fireEvent.press(getByLabelText("아세트아미노펜"));
    fireEvent.changeText(getByPlaceholderText("알러지 약물명 검색"), "아목");
    act(() => jest.advanceTimersByTime(250));
    fireEvent.press(getByLabelText("아목시실린캡슐 검색 결과 선택"));

    let submitted = false;
    await act(async () => {
      submitted = (await ref.current?.submit()) ?? false;
    });

    expect(submitted).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({
      allergies: ["페니실린", "아세트아미노펜", "아목시실린캡슐"],
      allergyMappings: {
        아목시실린캡슐: {
          type: "ATC_GROUP",
          value: "J01CA04",
          name: "아목시실린캡슐",
        },
      },
    });
  });
});
