/**
 * React Navigation, useThemeColor, Themed 컴포넌트용. 색 원본은 design-tokens (Tamagui와 동일).
 */

import { fontFamilies, palette } from './design-tokens';

export const Colors = {
  light: {
    ...palette.light,
    tabIconDefault: palette.light.icon,
    tabIconSelected: palette.light.tint,
  },
  dark: {
    ...palette.dark,
    tabIconDefault: palette.dark.icon,
    tabIconSelected: palette.dark.tint,
  },
};

export const Fonts = fontFamilies;
