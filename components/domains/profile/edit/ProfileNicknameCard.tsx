import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, TextInput, View } from "react-native";
import { Text } from "tamagui";

import { palette } from "@/constants/design-tokens";

export type ProfileNicknameCardProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ProfileNicknameCard({ value, onChange }: ProfileNicknameCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="person-outline" size={16} color={palette.green} />
        <Text style={styles.title}>사용자 닉네임</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="닉네임 입력"
        placeholderTextColor={palette.input_placeholder}
        style={styles.input}
        returnKeyType="done"
      />
      <Text style={styles.helper}>프로필에 표시될 이름입니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface_card,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: palette.black,
    letterSpacing: -0.15,
  },
  input: {
    height: 38,
    borderRadius: 12,
    backgroundColor: palette.gray,
    paddingHorizontal: 10,
    fontSize: 14,
    color: palette.black,
  },
  helper: {
    fontSize: 12,
    lineHeight: 14,
    color: palette.icon,
  },
});
