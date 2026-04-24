import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text } from "tamagui";

import { Badge } from "@/components/ui/Badge";
import { SelectChip } from "@/components/ui/SelectChip";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
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
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.tagsWrap}>
        {items.map((item) => (
          <Badge
            key={item}
            label={item}
            backgroundColor={style.tagBackground}
            textColor={palette.white}
            style={styles.tag}
            textStyle={styles.tagText}
            rightElement={
              <Pressable hitSlop={8} onPress={() => onRemoveItem(item)}>
                <Ionicons name="close" size={12} color={palette.white} />
              </Pressable>
            }
          />
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
            <SelectChip
              key={item}
              label={`+ ${item}`}
              selected={false}
              onPress={() => onAddItem(item)}
              height={27}
              px={10}
              borderWidth={1}
              unselectedBackground={style.quickTagBackground}
              unselectedBorderColor={style.quickTagBorder}
              unselectedTextColor={style.quickTagText}
              textFontSize={11}
              textFontWeight="400"
            />
          ))}
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 14,
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
    paddingHorizontal: 10,
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
});
