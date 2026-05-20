import { render } from "@testing-library/react-native";
import FamilyDetailRoute from "../[familyId]";

const mockUseLocalSearchParams = jest.fn();
const mockFamilyDetailScreen = jest.fn(() => null);

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@/components/domains/family", () => ({
  FamilyDetailScreen: (props: { familyId: number | null }) => mockFamilyDetailScreen(props),
}));

describe("app/(detail)/family/[familyId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("정수 familyId 문자열을 숫자로 변환해 전달한다", () => {
    mockUseLocalSearchParams.mockReturnValue({ familyId: "12" });
    render(<FamilyDetailRoute />);

    expect(mockFamilyDetailScreen).toHaveBeenCalledWith({ familyId: 12 });
  });

  it("배열 파라미터는 첫 번째 값을 사용한다", () => {
    mockUseLocalSearchParams.mockReturnValue({ familyId: ["34", "56"] });
    render(<FamilyDetailRoute />);

    expect(mockFamilyDetailScreen).toHaveBeenCalledWith({ familyId: 34 });
  });

  it("유효하지 않은 값이면 null을 전달한다", () => {
    mockUseLocalSearchParams.mockReturnValue({ familyId: "abc" });
    render(<FamilyDetailRoute />);

    expect(mockFamilyDetailScreen).toHaveBeenCalledWith({ familyId: null });
  });
});
