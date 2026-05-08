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
  shadow_base: "#000000",

  // variant 톤 - red (알러지 / 위험)
  red_soft: "#FFC9C9",
  /** 삭제·위험 액션 아웃라인 등 (red_soft보다 대비 강함) */
  red_outline: "#FFA2A2",
  red_medium: "#FB2C36",
  red_strong: "#E7000B",
  red_deep: "#9F0712",
  red_quick_text: "#C10007",

  // variant 톤 - blue (기저질환 / 정보)
  blue_soft: "#BEDBFF",
  blue_strong: "#155DFC",
  blue_deep: "#193CB8",
  blue_quick_text: "#1447E6",

  // variant 톤 - green (활성 / 성공)
  green_soft: "#7BF1A8",
  green_deep: "#00A63E",

  // neutral / input
  input_placeholder: "#64748B",
  border_muted: "#D1D5DC",
  surface_subtle: "#F9FAFB",
  /** 비활성 트랙·구분선 등 중립 표면 (≈ gray-100) */
  surface_neutral: "#F3F4F6",

  // common surface
  surface_card: "rgb(255,255,255)",
  surface_card_border: "rgba(255,255,255,0.3)",
  overlay_white_20: "rgba(255,255,255,0.2)",
  overlay_white_25: "rgba(255,255,255,0.25)",
  overlay_white_90: "rgba(255,255,255,0.9)",
  overlay_white_92: "rgba(255,255,255,0.92)",
  overlay_blue_20: "rgba(59,130,246,0.2)",

  // notice tone
  notice_bg_start: "#FFF7ED",
  notice_bg_end: "#FEFCE8",
  notice_border: "#FFD6A8",
  notice_title: "#9F2D00",
  notice_description: "#CA3500",
  pending_badge_bg: "#FFEDD4",
  pending_badge_text: "#CA3500",
  pending_status_bg: "#FF6900",
  pending_status_bg_end: "#FE9A00",
  pink: "#F6339A",
  warning_badge_bg: "#FFE4E6",
  schedule_required_border: "#8EC5FF",
  schedule_upcoming_border: "#BFC7D5",
  schedule_upcoming_start: "#9CA3AF",
  schedule_upcoming_end: "#6B7280",

  // linearGradient 3중첩 설정
  bg_green_line: ["#00C950", "#00BC7D", "#00BBA7"],
  bg_pink_line: ["#EFF6FF", "#FAF5FF", "#FDF2F8"],

  // linearGradient 2중첩 설정 (카드 배경)
  bg_allergy_card: ["#FEF2F2", "#FDF2F8"],
  bg_chronic_card: ["#EFF6FF", "#ECFEFF"],
  bg_family_active_card: ["#F0FDF4", "#ECFDF5"],
  bg_family_manage: ["#F8FAFC", "#EFF6FF"],
  bg_invite_icon: ["#00C950", "#00BC7D"],
  bg_pending_avatar: ["#FF8904", "#F0B100"],
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
