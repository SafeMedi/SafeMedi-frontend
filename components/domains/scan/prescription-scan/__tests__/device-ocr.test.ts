import * as ImagePicker from "expo-image-picker";
import { requireOptionalNativeModule } from "expo-modules-core";
import { extractDraftFromImageSource, extractDraftFromImageUri } from "../device-ocr";
import { parsePrescriptionFromOcrText } from "../ocr-parser";

const mockRequestCameraPermissionsAsync = jest.fn();
const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchCameraAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
const mockRequireOptionalNativeModule = requireOptionalNativeModule as jest.MockedFunction<
  typeof requireOptionalNativeModule
>;
const mockParsePrescriptionFromOcrText = parsePrescriptionFromOcrText as jest.MockedFunction<
  typeof parsePrescriptionFromOcrText
>;

jest.mock("expo-image-picker", () => ({
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
  },
  requestCameraPermissionsAsync: (...args: unknown[]) => mockRequestCameraPermissionsAsync(...args),
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) =>
    mockRequestMediaLibraryPermissionsAsync(...args),
  launchCameraAsync: (...args: unknown[]) => mockLaunchCameraAsync(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
}));

jest.mock("expo-modules-core", () => ({
  requireOptionalNativeModule: jest.fn(),
}));

jest.mock("../ocr-parser", () => ({
  parsePrescriptionFromOcrText: jest.fn(),
}));

describe("device-ocr", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestCameraPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
    });
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
    });
    mockLaunchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://camera.jpg" }],
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://gallery.jpg" }],
    });
    mockRequireOptionalNativeModule.mockReturnValue({
      isSupported: true,
      extractTextFromImage: jest.fn().mockResolvedValue(["처방전", "타이레놀"]),
    } as unknown as ReturnType<typeof requireOptionalNativeModule>);
    mockParsePrescriptionFromOcrText.mockReturnValue({
      title: "처방전",
      startDate: "2026-05-01",
      endDate: "2026-05-07",
      takeTimes: ["09:00"],
      medications: [{ atcCode: "A01", drugName: "타이레놀" }],
      rawText: "처방전",
    });
  });

  it("이미지 URI OCR 추출이 성공하면 draft를 반환한다", async () => {
    const draft = await extractDraftFromImageUri("file://image.jpg");

    expect(mockRequireOptionalNativeModule).toHaveBeenCalledWith("ExpoTextExtractor");
    expect(mockParsePrescriptionFromOcrText).toHaveBeenCalledWith("처방전\n타이레놀");
    expect(draft.title).toBe("처방전");
  });

  it("카메라 권한이 없으면 의미 있는 에러를 던진다", async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.DENIED,
    });

    await expect(extractDraftFromImageSource("camera")).rejects.toThrow(
      "카메라 권한이 필요합니다. 설정에서 카메라 접근을 허용해 주세요.",
    );
  });

  it("갤러리에서 취소하면 null을 반환한다", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });

    const result = await extractDraftFromImageSource("gallery");

    expect(result).toBeNull();
  });

  it("텍스트 추출 모듈이 없으면 개발 빌드 안내 에러를 던진다", async () => {
    mockRequireOptionalNativeModule.mockReturnValue(null);

    await expect(extractDraftFromImageUri("file://image.jpg")).rejects.toThrow(
      "온디바이스 OCR 모듈을 찾을 수 없습니다.",
    );
  });

  it("텍스트 추출 미지원 기기면 지원 불가 에러를 던진다", async () => {
    mockRequireOptionalNativeModule.mockReturnValue({
      isSupported: false,
      extractTextFromImage: jest.fn(),
    } as unknown as ReturnType<typeof requireOptionalNativeModule>);

    await expect(extractDraftFromImageUri("file://image.jpg")).rejects.toThrow(
      "이 기기에서는 온디바이스 OCR을 지원하지 않습니다.",
    );
  });
});
