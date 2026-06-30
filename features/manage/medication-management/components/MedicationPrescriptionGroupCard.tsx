import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type { MedicationTakeSlot } from "@/features/scan/prescription-scan-result/usePrescriptionScanResultViewModel";
import type { MedicationEditDraft } from "../medicationEditModel";
import type { MedicationManagementMedicationItem } from "../medicationManagementModel";
import { MedicationManagementItemCard } from "./MedicationManagementItemCard";

interface MedicationPrescriptionGroupCardProps {
  readonly title: string;
  readonly medicationCountLabel: string;
  readonly medications: readonly MedicationManagementMedicationItem[];
  readonly isExpanded: boolean;
  readonly isMedicationEditing: (medicationId: number) => boolean;
  readonly editDraft: MedicationEditDraft | null;
  readonly isSaveEditEnabled: boolean;
  readonly isSaving: boolean;
  readonly onToggleExpanded: () => void;
  readonly onDeletePrescription: () => void;
  readonly onStartEditMedication: (medicationId: number) => void;
  readonly onCancelEditMedication: () => void;
  readonly onSaveEditMedication: () => void;
  readonly onToggleEditTakeSlot: (slot: MedicationTakeSlot) => void;
  readonly onDeleteMedication: (medicationId: number, drugName: string) => void;
}

export function MedicationPrescriptionGroupCard({
  title,
  medicationCountLabel,
  medications,
  isExpanded,
  isMedicationEditing,
  editDraft,
  isSaveEditEnabled,
  isSaving,
  onToggleExpanded,
  onDeletePrescription,
  onStartEditMedication,
  onCancelEditMedication,
  onSaveEditMedication,
  onToggleEditTakeSlot,
  onDeleteMedication,
}: MedicationPrescriptionGroupCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <LinearGradient
        colors={[palette.blue, palette.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} ${isExpanded ? "접기" : "펼치기"}`}
          onPress={onToggleExpanded}
          style={styles.headerMain}
        >
          <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={palette.white} />
          <Text style={styles.headerTitle}>📋 {title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{medicationCountLabel}</Text>
          </View>
        </Pressable>

        <XStack items="center" gap={7}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title} 처방전 삭제`}
            onPress={onDeletePrescription}
            style={styles.iconButton}
          >
            <Ionicons name="trash-outline" size={14} color={palette.white} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title} ${isExpanded ? "접기" : "펼치기"}`}
            onPress={onToggleExpanded}
            style={styles.iconButton}
          >
            <Ionicons
              name={isExpanded ? "chevron-down" : "chevron-forward"}
              size={16}
              color={palette.white}
            />
          </Pressable>
        </XStack>
      </LinearGradient>

      {isExpanded ? (
        <YStack gap={10} p={10} style={styles.body}>
          {medications.map((medication) => {
            const isEditing = isMedicationEditing(medication.medicationId);
            return (
              <MedicationManagementItemCard
                key={medication.id}
                medication={medication}
                isEditing={isEditing}
                editDraft={isEditing ? editDraft : null}
                isSaveEnabled={isSaveEditEnabled}
                isSaving={isSaving && isEditing}
                onEdit={() => onStartEditMedication(medication.medicationId)}
                onDelete={() => onDeleteMedication(medication.medicationId, medication.drugName)}
                onCancelEdit={onCancelEditMedication}
                onSaveEdit={onSaveEditMedication}
                onToggleTakeSlot={onToggleEditTakeSlot}
              />
            );
          })}
        </YStack>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: palette.overlay_white_90,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  headerTitle: {
    color: palette.white,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    flexShrink: 1,
  },
  countBadge: {
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    backgroundColor: palette.overlay_white_20,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: palette.white,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  iconButton: {
    width: 24,
    height: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
