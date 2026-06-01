import { fireEvent, render, screen } from "@testing-library/react-native";
import { Linking, Pressable, Text } from "react-native";
import { NearbyMedicalFacilitiesScreen } from "../NearbyMedicalFacilitiesScreen";
import type { MedicalFacility } from "../types";
import type { NearbyMedicalFacilitiesViewModel } from "../useNearbyMedicalFacilitiesViewModel";

interface MockBaseNaverMapProps {
  readonly initialRegion: NearbyMedicalFacilitiesViewModel["initialRegion"];
  readonly currentCoordinate: NearbyMedicalFacilitiesViewModel["currentCoordinate"];
  readonly facilities: readonly {
    readonly id: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly caption: string;
    readonly category: "pharmacy" | "emergency";
  }[];
  readonly onSelectFacility: (facilityId: string | null) => void;
}

interface MockMedicalFacilityCardProps {
  readonly facility: MedicalFacility;
  readonly onPressCall: (facility: MedicalFacility) => Promise<void>;
  readonly onPressDirections: (facility: MedicalFacility) => Promise<void>;
}

const mockBaseNaverMap = jest.fn((_props: MockBaseNaverMapProps) => <Text>map</Text>);
const mockMedicalFacilityCard = jest.fn((props: MockMedicalFacilityCardProps) => {
  return (
    <>
      <Text>{props.facility.name}</Text>
      <Pressable onPress={() => void props.onPressCall(props.facility)}>
        <Text>{`${props.facility.id}-call`}</Text>
      </Pressable>
      <Pressable onPress={() => void props.onPressDirections(props.facility)}>
        <Text>{`${props.facility.id}-directions`}</Text>
      </Pressable>
    </>
  );
});

const mockUseNearbyMedicalFacilitiesViewModel = jest.fn();
const mockOpenUrl = jest.fn();

jest.mock("../useNearbyMedicalFacilitiesViewModel", () => ({
  useNearbyMedicalFacilitiesViewModel: () => mockUseNearbyMedicalFacilitiesViewModel(),
}));

jest.mock("../../components/BaseNaverMap", () => ({
  BaseNaverMap: (props: MockBaseNaverMapProps) => mockBaseNaverMap(props),
}));

jest.mock("../components/MedicalFacilityCard", () => ({
  MedicalFacilityCard: (props: MockMedicalFacilityCardProps) => mockMedicalFacilityCard(props),
}));

jest.mock("@/components/ui/SelectChip", () => ({
  SelectChip: ({ label, onPress }: { readonly label: string; readonly onPress: () => void }) => {
    const { Pressable: LocalPressable, Text: LocalText } = require("react-native");
    return (
      <LocalPressable onPress={onPress}>
        <LocalText>{label}</LocalText>
      </LocalPressable>
    );
  },
}));

jest.spyOn(Linking, "openURL").mockImplementation((url: string) => {
  mockOpenUrl(url);
  return Promise.resolve(true);
});

const BASE_FACILITY: MedicalFacility = {
  id: "facility-1",
  name: "서울약국",
  category: "pharmacy",
  address: "서울시 강남구 역삼동",
  roadAddress: "서울시 강남구 테헤란로",
  latitude: 37.5,
  longitude: 127.01,
  distanceMeters: 150,
  phoneNumber: "02-1234-5678",
  is24Hours: true,
  status: "open",
};

const BASE_VIEW_MODEL: NearbyMedicalFacilitiesViewModel = {
  isLoadingLocation: false,
  isLoadingFacilities: false,
  isRefreshingFacilities: false,
  locationError: null,
  facilitiesError: null,
  source: "mock",
  currentAddress: "서울 강남구",
  currentCoordinate: { latitude: 37.5, longitude: 127.01 },
  initialRegion: {
    latitude: 37.5,
    longitude: 127.01,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  category: "all",
  searchKeyword: "",
  selectedFacilityId: "facility-1",
  facilities: [BASE_FACILITY],
  setCategory: jest.fn(),
  setSearchKeyword: jest.fn(),
  setSelectedFacilityId: jest.fn(),
  refetchFacilities: jest.fn(async () => {}),
};

describe("NearbyMedicalFacilitiesScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNearbyMedicalFacilitiesViewModel.mockReturnValue(BASE_VIEW_MODEL);
  });

  it("위치 로딩 중 상태를 렌더링한다", () => {
    mockUseNearbyMedicalFacilitiesViewModel.mockReturnValue({
      ...BASE_VIEW_MODEL,
      isLoadingLocation: true,
    });

    render(<NearbyMedicalFacilitiesScreen />);

    expect(screen.getByText("현재 위치를 불러오는 중이에요.")).toBeTruthy();
  });

  it("위치 정보가 없으면 에러 메시지를 렌더링한다", () => {
    mockUseNearbyMedicalFacilitiesViewModel.mockReturnValue({
      ...BASE_VIEW_MODEL,
      initialRegion: null,
      currentCoordinate: null,
      locationError: "위치 확인 실패",
    });

    render(<NearbyMedicalFacilitiesScreen />);

    expect(screen.getByText("위치 확인 실패")).toBeTruthy();
  });

  it("정상 상태에서 목록을 렌더링하고 검색/카테고리/액션을 처리한다", async () => {
    render(<NearbyMedicalFacilitiesScreen />);

    expect(screen.getByText("주변 의료기관")).toBeTruthy();
    expect(screen.getByText("1개 의료기관")).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText("약국, 병원 검색..."), "강남");
    expect(BASE_VIEW_MODEL.setSearchKeyword).toHaveBeenCalledWith("강남");

    fireEvent.press(screen.getByText("응급실"));
    expect(BASE_VIEW_MODEL.setCategory).toHaveBeenCalledWith("emergency");

    const mapProps = mockBaseNaverMap.mock.calls[0][0] as MockBaseNaverMapProps;
    expect(mapProps.facilities[0]).toEqual(
      expect.objectContaining({
        id: "facility-1",
        caption: "약",
        category: "pharmacy",
      }),
    );

    fireEvent.press(screen.getByText("facility-1-call"));
    expect(mockOpenUrl).toHaveBeenCalledWith("tel:02-1234-5678");

    fireEvent.press(screen.getByText("facility-1-directions"));
    expect(mockOpenUrl).toHaveBeenCalledWith(
      "https://map.naver.com/v5/search/%EC%84%9C%EC%9A%B8%EC%95%BD%EA%B5%AD%20%EC%84%9C%EC%9A%B8%EC%8B%9C%20%EA%B0%95%EB%82%A8%EA%B5%AC%20%ED%85%8C%ED%97%A4%EB%9E%80%EB%A1%9C",
    );
  });

  it("전화번호가 없으면 전화 링크를 열지 않는다", () => {
    mockUseNearbyMedicalFacilitiesViewModel.mockReturnValue({
      ...BASE_VIEW_MODEL,
      facilities: [{ ...BASE_FACILITY, id: "facility-2", phoneNumber: null }],
    });

    render(<NearbyMedicalFacilitiesScreen />);

    fireEvent.press(screen.getByText("facility-2-call"));
    expect(mockOpenUrl).not.toHaveBeenCalled();
  });
});
