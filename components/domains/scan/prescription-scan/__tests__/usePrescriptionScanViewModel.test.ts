import { act, renderHook } from "@testing-library/react-native";
import { router } from "expo-router";
import { parseApiError } from "@/api/error";
import { useCreatePrescriptionByScanMutation } from "@/api/queries/prescription-scan";
import type { ScanPrescriptionDraft } from "../types";
import { usePrescriptionScanViewModel } from "../usePrescriptionScanViewModel";

const mockExtractDraftFromImageSource = jest.fn();
const mockExtractDraftFromImageUri = jest.fn();
const mockParsePrescriptionFromJson = jest.fn();
const mockMutateAsync = jest.fn();
const mockSetResult = jest.fn();

const BASE_DRAFT: ScanPrescriptionDraft = {
  title: "아침 약",
  startDate: "2026-05-01",
  endDate: "2026-05-07",
  takeTimes: ["09:00"],
  medications: [{ atcCode: "A01", drugName: "테스트 약" }],
  rawText: "raw",
};

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("../device-ocr", () => ({
  extractDraftFromImageSource: (...args: unknown[]) => mockExtractDraftFromImageSource(...args),
  extractDraftFromImageUri: (...args: unknown[]) => mockExtractDraftFromImageUri(...args),
}));

jest.mock("../ocr-parser", () => ({
  parsePrescriptionFromJson: (...args: unknown[]) => mockParsePrescriptionFromJson(...args),
}));

jest.mock("../usePrescriptionOcrResultStore", () => ({
  usePrescriptionOcrResultStore: (
    selector: (state: { setResult: (value: unknown) => void }) => unknown,
  ) => selector({ setResult: mockSetResult }),
}));

jest.mock("@/api/error", () => ({
  parseApiError: jest.fn(),
}));

jest.mock("@/api/queries/prescription-scan", () => ({
  useCreatePrescriptionByScanMutation: jest.fn(),
}));

describe("usePrescriptionScanViewModel", () => {
  const mockRouterPush = router.push as jest.MockedFunction<typeof router.push>;

  beforeEach(() => {
    jest.clearAllMocks();
    (parseApiError as jest.MockedFunction<typeof parseApiError>).mockResolvedValue({
      message: "서버 오류",
    });
    (
      useCreatePrescriptionByScanMutation as jest.MockedFunction<
        typeof useCreatePrescriptionByScanMutation
      >
    ).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePrescriptionByScanMutation>);
  });

  it("갤러리 OCR 성공 시 draft를 반영하고 결과 화면으로 이동한다", async () => {
    mockExtractDraftFromImageSource.mockResolvedValue({
      draft: BASE_DRAFT,
      imageUri: "file://gallery.png",
    });

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromGallery();
    });

    expect(result.current.draft).toEqual(BASE_DRAFT);
    expect(result.current.selectedImageUri).toBe("file://gallery.png");
    expect(mockSetResult).toHaveBeenCalledWith({
      draft: BASE_DRAFT,
      imageUri: "file://gallery.png",
    });
    expect(mockRouterPush).toHaveBeenCalledWith("/(detail)/scan/scan-result");
  });

  it("OCR 결과가 없으면 상태를 유지하고 이동하지 않는다", async () => {
    mockExtractDraftFromImageSource.mockResolvedValue(null);

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.extractFromCamera();
    });

    expect(result.current.draft).toBeNull();
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockSetResult).not.toHaveBeenCalled();
  });

  it("draft 없이 submitDraft를 호출하면 사용자 안내 에러를 설정한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.submitDraft();
    });

    expect(result.current.error?.message).toContain("등록할 스캔 결과가 없습니다");
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("재추출 대상 이미지가 없으면 retryExtract에서 에러를 설정한다", async () => {
    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      await result.current.retryExtract();
    });

    expect(result.current.error?.message).toContain("재시도할 이미지가 없습니다");
  });

  it("잘못된 수동 JSON 적용 시 에러를 노출한다", async () => {
    mockParsePrescriptionFromJson.mockImplementation(() => {
      throw new Error("JSON 파싱 실패");
    });

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      result.current.updateManualJson("{ broken");
      result.current.applyManualJson();
    });

    expect(result.current.error?.message).toBe("JSON 파싱 실패");
  });

  it("수동 입력 열기 후 submit 실패 시 API 에러 메시지를 사용한다", async () => {
    mockMutateAsync.mockRejectedValue(new Error("request failed"));

    const { result } = renderHook(() => usePrescriptionScanViewModel());

    await act(async () => {
      result.current.openManualInput();
    });

    await act(async () => {
      await result.current.submitDraft();
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(result.current.error?.message).toBe("서버 오류");
  });
});
