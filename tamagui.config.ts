import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

import { palette } from "./constants/design-tokens";

function semanticTheme(mode: "light" | "dark") {
  const p = palette[mode];
  return {
    background: p.background,
    backgroundHover: p.background,
    backgroundPress: p.background,
    backgroundFocus: p.background,
    color: p.text,
    color12: p.text,
    accentBackground: p.tint,
    accentColor: p.tint,
    borderColor: p.icon,
    borderColorHover: p.icon,
    placeholderColor: p.icon,
  };
}

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      ...semanticTheme("light"),
    },
    dark: {
      ...defaultConfig.themes.dark,
      ...semanticTheme("dark"),
    },
  },
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
