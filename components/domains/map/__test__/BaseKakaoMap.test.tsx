import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { BaseKakaoMap } from "../components/BaseKakaoMap";

interface MockWebViewProps {
  readonly source?: { readonly html?: string };
  readonly onMessage?: (event: { readonly nativeEvent: { readonly data: string } }) => void;
}

const mockWebView = jest.fn((_props: MockWebViewProps) => <Text>webview-map</Text>);

jest.mock("react-native-webview", () => ({
  WebView: (props: MockWebViewProps) => mockWebView(props),
}));

describe("BaseKakaoMap", () => {
  const originalMapJsKey = process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY = "test-map-js-key";
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY = originalMapJsKey;
  });

  it("카카오 지도 WebView를 렌더링하고 마커 정보를 HTML에 포함한다", () => {
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
      <BaseKakaoMap
        initialRegion={initialRegion}
        currentCoordinate={currentCoordinate}
        facilities={facilities}
        onSelectFacility={onSelectFacility}
      />,
    );

    expect(mockWebView).toHaveBeenCalledTimes(1);
    const html = mockWebView.mock.calls[0][0].source?.html ?? "";
    expect(html).toContain("test-map-js-key");
    expect(html).toContain('"id":"f-1"');
    expect(html).toContain('"caption":"약"');
    expect(html).toContain("selectFacility");
  });

  it("지도 JS 키가 없으면 WebView를 렌더링하지 않는다", () => {
    process.env.EXPO_PUBLIC_KAKAO_MAP_JS_KEY = "";

    const { queryByText } = render(
      <BaseKakaoMap
        initialRegion={{
          latitude: 37.5665,
          longitude: 126.978,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        currentCoordinate={{ latitude: 37.5665, longitude: 126.978 }}
        facilities={[]}
        onSelectFacility={jest.fn()}
      />,
    );

    expect(queryByText("webview-map")).toBeNull();
    expect(mockWebView).not.toHaveBeenCalled();
  });
});
