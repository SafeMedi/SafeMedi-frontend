import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";
import { parsePrescriptionFromOcrText } from "./ocr-parser";
import type { ScanPrescriptionDraft } from "./types";

type OcrImageSource = "camera" | "gallery";
interface TextExtractorModule {
  readonly isSupported: boolean;
  readonly extractTextFromImage: (uri: string) => Promise<string[]>;
}

const IMAGE_MEDIA_TYPES: ImagePicker.MediaType[] = ["images"];
const IMAGE_PICKER_QUALITY = 1;
const DEV_BUILD_REQUIRED_MESSAGE =
  "온디바이스 OCR 모듈을 찾을 수 없습니다. Expo Go에서는 동작하지 않으며 개발 빌드(또는 EAS 빌드)로 실행해야 합니다.";
const IMAGE_FILE_MISSING_MESSAGE =
  "선택한 이미지를 찾을 수 없습니다. 사진을 다시 선택하거나 다시 촬영해 주세요.";
const IMAGE_FILE_CHECK_RETRY_DELAY_MS = 400;
const FILE_URI_SCHEME = "file://";

function buildPermissionDeniedMessage(source: OcrImageSource): string {
  return source === "camera"
    ? "카메라 권한이 필요합니다. 설정에서 카메라 접근을 허용해 주세요."
    : "갤러리 접근 권한이 필요합니다. 설정에서 사진 접근을 허용해 주세요.";
}

function normalizeUnknownError(error: unknown, fallbackMessage: string): Error {
  return error instanceof Error ? error : new Error(fallbackMessage);
}

function isTextExtractorModule(value: unknown): value is TextExtractorModule {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const moduleCandidate = value as Partial<TextExtractorModule>;
  return (
    typeof moduleCandidate.isSupported === "boolean" &&
    typeof moduleCandidate.extractTextFromImage === "function"
  );
}

async function loadTextExtractorModule(): Promise<TextExtractorModule> {
  const nativeModule = requireOptionalNativeModule<unknown>("ExpoTextExtractor");
  if (!isTextExtractorModule(nativeModule)) {
    throw new Error(DEV_BUILD_REQUIRED_MESSAGE);
  }
  return nativeModule;
}

function ensureTextExtractorSupported(module: TextExtractorModule): void {
  if (!module.isSupported) {
    throw new Error("이 기기에서는 온디바이스 OCR을 지원하지 않습니다.");
  }
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function ensureImageFileExists(uri: string): Promise<void> {
  if (new File(uri).exists) {
    return;
  }
  await wait(IMAGE_FILE_CHECK_RETRY_DELAY_MS);
  if (!new File(uri).exists) {
    throw new Error(IMAGE_FILE_MISSING_MESSAGE);
  }
}

// expo-text-extractor의 Android 구현은 file:// 스킴을 벗기지 않고 그대로
// java.io.File(String)에 넘겨서 항상 파일을 찾지 못한다. iOS는 반대로 URL
// 파싱을 위해 스킴이 있어야 하므로 Android에서만 스킴을 제거해 전달한다.
function toTextExtractorUri(uri: string): string {
  if (Platform.OS === "android" && uri.startsWith(FILE_URI_SCHEME)) {
    return uri.slice(FILE_URI_SCHEME.length);
  }
  return uri;
}

async function requestPermission(source: OcrImageSource): Promise<void> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
    throw new Error(buildPermissionDeniedMessage(source));
  }
}

async function pickImageUri(source: OcrImageSource): Promise<string | null> {
  await requestPermission(source);

  const pickerResult =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: IMAGE_MEDIA_TYPES,
          quality: IMAGE_PICKER_QUALITY,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: IMAGE_MEDIA_TYPES,
          quality: IMAGE_PICKER_QUALITY,
          allowsMultipleSelection: false,
        });

  if (pickerResult.canceled) {
    return null;
  }

  const imageUri = pickerResult.assets[0]?.uri;
  if (!imageUri) {
    throw new Error("이미지 경로를 불러오지 못했습니다. 다시 시도해 주세요.");
  }
  return imageUri;
}

export async function extractDraftFromImageUri(imageUri: string): Promise<ScanPrescriptionDraft> {
  const textExtractorModule = await loadTextExtractorModule();
  ensureTextExtractorSupported(textExtractorModule);
  await ensureImageFileExists(imageUri);
  try {
    const extractedTexts = await textExtractorModule.extractTextFromImage(
      toTextExtractorUri(imageUri),
    );
    const rawText = extractedTexts.join("\n");
    return parsePrescriptionFromOcrText(rawText);
  } catch (error) {
    throw normalizeUnknownError(error, "OCR 텍스트 추출 중 오류가 발생했습니다.");
  }
}

export async function extractDraftFromImageSource(source: OcrImageSource): Promise<{
  readonly imageUri: string;
  readonly draft: ScanPrescriptionDraft;
} | null> {
  const imageUri = await pickImageUri(source);
  if (!imageUri) {
    return null;
  }
  const draft = await extractDraftFromImageUri(imageUri);
  return { imageUri, draft };
}
