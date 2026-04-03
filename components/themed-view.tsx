import { View, type ViewProps } from "react-native";

import { palette } from "@/constants/design-tokens";

export type ThemedViewProps = ViewProps & {
  /** 지정 시 팔레트 배경 대신 이 색을 씁니다. */
  backgroundColor?: string;
};

export function ThemedView({ style, backgroundColor: backgroundOverride, ...otherProps }: ThemedViewProps) {
  const backgroundColor = backgroundOverride ?? palette.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
