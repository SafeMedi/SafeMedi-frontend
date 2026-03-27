/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { palette } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemeColorName = keyof typeof palette.light;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorName
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return palette[theme][colorName];
  }
}
