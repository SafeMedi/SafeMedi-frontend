import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { palette } from "@/constants/design-tokens";

const BG_PINK_LINE_STOPS = [0, 0.5, 1] as const;

export default function NearbyScreen() {
  return (
    <LinearGradient
      colors={[...palette.bg_pink_line]}
      locations={[...BG_PINK_LINE_STOPS]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    />
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
