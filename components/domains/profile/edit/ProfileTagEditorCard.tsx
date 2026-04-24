import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text } from "tamagui";

import { palette } from "@/constants/design-tokens";

import {
  PROFILE_EDIT_QUICK_ITEMS,
  PROFILE_EDIT_SECTION_STYLES,
  type ProfileEditSectionVariant,
} from "./constants";

export type ProfileTagEditorCardProps = {
  variant: ProfileEditSectionVariant;
  title: string;
  items: readonly string[];
  inputValue: string;
  inputPlaceholder: string;
  onInputChange: (value: string) => void;
  onAddItem: (value: string) => void;
  onRemoveItem: (value: string) => void;
};

export function ProfileTagEditorCard({
  variant,
  title,
  items,
  inputValue,
  inputPlaceholder,
  onInputChange,
  onAddItem,
  onRemoveItem,
}: ProfileTagEditorCardProps) {
  const style = PROFILE_EDIT_SECTION_STYLES[variant];
  const quickItems = PROFILE_EDIT_QUICK_ITEMS[variant];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.tagsWrap}>
        {items.map((item) => (
          <View key={item} style={[styles.tag, { backgroundColor: style.tagBackground }]}>
            <Text style={styles.tagText}>{item}</Text>
            <Pressable hitSlop={8} onPress={() => onRemoveItem(item)}>
              <Ionicons name="close" size={12} color={palette.white} />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={inputValue}
          onChangeText={onInputChange}
          placeholder={inputPlaceholder}
          placeholderTextColor={palette.input_placeholder}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={() => onAddItem(inputValue)}
        />
        <Pressable onPress={() => onAddItem(inputValue)} hitSlop={6}>
          <LinearGradient
            colors={[...style.addButtonGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButton}
          >
            <Ionicons name="add" size={14} color={palette.white} />
          </LinearGradient>
        </Pressable>
      </View>

      <View style={styles.quickWrap}>
        <Text style={styles.quickLabel}>빠른 추가:</Text>
        <View style={styles.quickItems}>
          {quickItems.map((item) => (
            <Pressable
              key={item}
              onPress={() => onAddItem(item)}
              style={[
                styles.quickTag,
                {
                  borderColor: style.quickTagBorder,
                  backgroundColor: style.quickTagBackground,
                },
              ]}
            >
              <Text style={[styles.quickTagText, { color: style.quickTagText }]}>{`+ ${item}`}</Text>
            </Pressable>
          ))}
        </View>
      </View>
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
    gap: 14,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: palette.black,
    letterSpacing: -0.15,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    height: 30,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: palette.white,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 32,
    borderRadius: 12,
    backgroundColor: palette.gray,
    paddingHorizontal: 10,
    fontSize: 14,
    color: palette.black,
  },
  addButton: {
    width: 35,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickWrap: {
    gap: 6,
  },
  quickLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: palette.icon,
  },
  quickItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quickTagText: {
    fontSize: 11,
    lineHeight: 14,
  },
});
