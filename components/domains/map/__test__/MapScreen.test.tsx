import { render, screen } from "@testing-library/react-native";
import { MapScreen } from "../MapScreen";

jest.mock("../nearby-medical-facilities/NearbyMedicalFacilitiesScreen", () => ({
  NearbyMedicalFacilitiesScreen: () => {
    const { Text } = require("react-native");
    return <Text>주변 의료기관 화면</Text>;
  },
}));

describe("MapScreen", () => {
  it("주변 의료기관 화면을 렌더링한다", () => {
    render(<MapScreen />);
    expect(screen.getByText("주변 의료기관 화면")).toBeTruthy();
  });
});
