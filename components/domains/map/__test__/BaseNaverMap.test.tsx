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
  readonly latitude: number;
  readonly longitude: number;
  readonly caption: {
    readonly text: string;
  };
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

  it("NaverMapView와 marker overlay를 올바른 좌표로 렌더링한다", () => {
    const initialRegion = {
      latitude: 37.5665,
      longitude: 126.978,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    const markerCoordinate = {
      latitude: 37.5665,
      longitude: 126.978,
    };
    const markerCaption = "서울특별시 중구 세종대로";

    render(
      <BaseNaverMap
        initialRegion={initialRegion}
        markerCoordinate={markerCoordinate}
        markerCaption={markerCaption}
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

    expect(mockMarkerOverlay).toHaveBeenCalledWith({
      latitude: markerCoordinate.latitude,
      longitude: markerCoordinate.longitude,
      caption: { text: markerCaption },
    });
  });
});
