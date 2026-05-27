import { render, screen } from "@testing-library/react-native";
import type { BaseNaverMapProps } from "../components/BaseNaverMap";
import { MapScreen } from "../MapScreen";
import type { MapViewModel } from "../useMapViewModel";

const mockUseMapViewModel = jest.fn() as jest.MockedFunction<() => MapViewModel>;
const mockBaseNaverMap = jest.fn() as jest.MockedFunction<(props: BaseNaverMapProps) => null>;

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

jest.mock("../useMapViewModel", () => ({
  useMapViewModel: () => mockUseMapViewModel(),
}));

jest.mock("../components/BaseNaverMap", () => ({
  BaseNaverMap: (props: BaseNaverMapProps) => {
    mockBaseNaverMap(props);
    return null;
  },
}));

const READY_STATE: MapViewModel = {
  isLoading: false,
  errorMessage: null,
  initialRegion: {
    latitude: 37.5665,
    longitude: 126.978,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  markerCoordinate: {
    latitude: 37.5665,
    longitude: 126.978,
  },
  currentAddress: "서울특별시 중구 세종대로",
};

describe("MapScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("위치 로딩 중에는 로딩 문구를 보여준다", () => {
    mockUseMapViewModel.mockReturnValue({
      ...READY_STATE,
      isLoading: true,
    });

    render(<MapScreen />);

    expect(screen.getByText("현재 위치를 불러오는 중이에요.")).toBeTruthy();
    expect(mockBaseNaverMap).not.toHaveBeenCalled();
  });

  it("지도 준비 실패 시 에러 문구를 보여준다", () => {
    mockUseMapViewModel.mockReturnValue({
      ...READY_STATE,
      errorMessage: "위치 권한이 허용되지 않았습니다.",
      initialRegion: null,
      markerCoordinate: null,
      currentAddress: null,
    });

    render(<MapScreen />);

    expect(screen.getByText("위치 권한이 허용되지 않았습니다.")).toBeTruthy();
    expect(mockBaseNaverMap).not.toHaveBeenCalled();
  });

  it("지도 준비가 완료되면 BaseNaverMap에 좌표와 캡션을 전달한다", () => {
    mockUseMapViewModel.mockReturnValue(READY_STATE);

    render(<MapScreen />);

    expect(mockBaseNaverMap).toHaveBeenCalledTimes(1);
    const [props] = mockBaseNaverMap.mock.calls[0];

    expect(props.initialRegion).toEqual(READY_STATE.initialRegion);
    expect(props.markerCoordinate).toEqual(READY_STATE.markerCoordinate);
    expect(props.markerCaption).toBe(READY_STATE.currentAddress);
  });
});
