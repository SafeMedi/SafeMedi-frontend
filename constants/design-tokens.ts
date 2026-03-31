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

  text_black: "#364153",

  color_green: "#00A63E",

  bg_green_line: ["#00C950", "#00BC7D", "#00BBA7"],
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
