import { Platform } from "react-native";

/**
 * 앱 전역 색·폰트의 단일 원본. Tamagui·React Navigation·컴포넌트가 모두 여기서 파생됩니다.
 */
export const palette = {
  text: "#11181C",
  background: "#ffffff",
  tint: "#0a7ea4",
  icon: "#4A5565",
  link: "#0a7ea4",

  // color 설정
  white: "#ffffff",
  black: "#364153",
  green: "#00C950",
  light_green: "#B9F8CF",
  blue: "#2B7FFF",
  red: "#DC2626",
  gray: "#F8FAFC",
  dark_gray: "#E5E7EB",
  orange: "#FF4B22",
  purple: "#AD46FF",
  opal: "#00BBA7",

  // linearGradient 3중첩 설정
  bg_green_line: ["#00C950", "#00BC7D", "#00BBA7"],
  bg_pink_line: ["#EFF6FF", "#FAF5FF", "#FDF2F8"],
} as const;

type FontFaces = {
  sans: string;
  serif: string;
  rounded: string;
  mono: string;
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
}) as FontFaces;
