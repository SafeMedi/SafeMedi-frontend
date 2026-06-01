import { render } from "@testing-library/react-native";
import { View } from "react-native";
import { BaseNaverMap } from "../components/BaseNaverMap";

interface MockMapViewProps {
  readonly children?: React.ReactNode;
  readonly initialRegion?: unknown;
  readonly isExtentBoundedInKorea?: boolean;
  readonly isShowScaleBar?: boolean;
  readonly isShowZoomControls?: boolean;
  readonly style?: unknown;
}

interface MockMarkerOverlayProps {
  readonly key?: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly caption: {
    readonly text: string;
  };
  readonly icon?: {
    readonly tintColor?: string;
  };
  readonly onTap?: () => void;
}

const mockNaverMapView = jest.fn((props: MockMapViewProps) => <View>{props.children}</View>);
const mockMarkerOverlay = jest.fn((_props: MockMarkerOverlayProps) => null);

jest.mock("@mj-studio/react-native-naver-map", () => ({
  NaverMapView: (props: MockMapViewProps) => mockNaverMapView(props),
  NaverMapMarkerOverlay: (props: MockMarkerOverlayProps) => mockMarkerOverlay(props),
}));

describe("BaseNaverMap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("현재 위치와 시설 마커를 올바르게 렌더링한다", () => {
    const initialRegion = {
      latitude: 37.5665,
      longitude: 126.978,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    const currentCoordinate = {
      latitude: 37.5665,
      longitude: 126.978,
    };
    const facilities = [
      {
        id: "f-1",
        latitude: 37.5672,
        longitude: 126.9775,
        caption: "약",
        category: "pharmacy" as const,
      },
      {
        id: "f-2",
        latitude: 37.5681,
        longitude: 126.9792,
        caption: "응",
        category: "emergency" as const,
      },
    ];
    const onSelectFacility = jest.fn();

    render(
      <BaseNaverMap
        initialRegion={initialRegion}
        currentCoordinate={currentCoordinate}
        facilities={facilities}
        onSelectFacility={onSelectFacility}
      />,
    );

    expect(mockNaverMapView).toHaveBeenCalledTimes(1);
    expect(mockNaverMapView.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        initialRegion,
        isExtentBoundedInKorea: true,
        isShowScaleBar: false,
        isShowZoomControls: false,
      }),
    );

    expect(mockMarkerOverlay).toHaveBeenCalledTimes(3);
    expect(mockMarkerOverlay.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        latitude: currentCoordinate.latitude,
        longitude: currentCoordinate.longitude,
        caption: { text: "현" },
      }),
    );

    expect(mockMarkerOverlay.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        latitude: facilities[0].latitude,
        longitude: facilities[0].longitude,
        caption: { text: facilities[0].caption },
      }),
    );

    const secondFacilityMarker = mockMarkerOverlay.mock.calls[2][0];
    secondFacilityMarker.onTap?.();
    expect(onSelectFacility).toHaveBeenCalledWith("f-2");
  });
});
