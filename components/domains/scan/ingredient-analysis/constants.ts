import type { AnalysisRiskLevel } from "@/api/types";
import { palette } from "@/constants/design-tokens";
import type { RiskTone } from "./types";

export const RISK_TONE_BY_LEVEL: Record<AnalysisRiskLevel, RiskTone> = {
  SAFE: {
    label: "안전",
    startColor: palette.green,
    endColor: palette.opal,
    badgeBackground: "#DCFCE7",
    badgeTextColor: "#008236",
  },
  CAUTION: {
    label: "주의",
    startColor: "#F0B100",
    endColor: "#FF6900",
    badgeBackground: "#FEF9C2",
    badgeTextColor: "#A65F00",
  },
  DANGER: {
    label: "위험",
    startColor: palette.red_medium,
    endColor: palette.pink,
    badgeBackground: "#FFE2E2",
    badgeTextColor: palette.red_quick_text,
  },
};
