import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { getApiErrorMessage } from "@/api/error";
import { useDeleteFamily, useFamilyMember, useUpdateFamilyRelation } from "@/api/queries/family";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PillButton } from "@/components/ui/PillButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { FamilyScreenHeader } from "./components/FamilyScreenHeader";

interface FamilyDetailScreenProps {
  readonly familyId: number | null;
}

export function FamilyDetailScreen({ familyId }: FamilyDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { data: family, isLoading, isError, refetch } = useFamilyMember(familyId);
  const updateRelationMutation = useUpdateFamilyRelation();
  const deleteFamilyMutation = useDeleteFamily();
  const [relation, setRelation] = useState("");
  const isInvalidFamilyId = familyId === null;

  useEffect(() => {
    if (family) {
      setRelation(family.relation);
    }
  }, [family]);

  const trimmedRelation = relation.trim();
  const canSave =
    familyId !== null &&
    !!family &&
    trimmedRelation.length > 0 &&
    trimmedRelation.length <= 20 &&
    trimmedRelation !== family.relation &&
    !updateRelationMutation.isPending;

  const handleSaveRelation = () => {
    if (!canSave || familyId === null) {
      return;
    }

    updateRelationMutation.mutate(
      { familyId, body: { relation: trimmedRelation } },
      {
        onSuccess: () => {
          Alert.alert("호칭 수정 완료", "가족 호칭을 수정했어요.");
        },
        onError: async (error) => {
          const message = await getApiErrorMessage(
            error,
            "가족 호칭 수정에 실패했습니다. 잠시 후 다시 시도해주세요.",
          );
          Alert.alert("호칭 수정 실패", message);
        },
      },
    );
  };

  const handleDeleteFamily = () => {
    if (familyId === null) {
      return;
    }

    Alert.alert("가족 연동 해제", "이 가족과의 연동을 해제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "해제",
        style: "destructive",
        onPress: () => {
          deleteFamilyMutation.mutate(familyId, {
            onSuccess: () => {
              Alert.alert("연동 해제 완료", "가족 연동을 해제했어요.");
              router.back();
            },
            onError: async (error) => {
              const message = await getApiErrorMessage(
                error,
                "가족 연동 해제에 실패했습니다. 잠시 후 다시 시도해주세요.",
              );
              Alert.alert("연동 해제 실패", message);
            },
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap={14}>
          <FamilyScreenHeader
            title={family ? `${family.relation} 님` : "가족 관리"}
            subtitle="가족 구성원"
            onBack={() => router.back()}
          />

          {isLoading ? (
            <View style={styles.feedbackContainer}>
              <LoadingSpinner accessibilityLabel="가족 정보 로딩 중" />
              <Text style={styles.feedbackText}>가족 정보를 불러오는 중입니다.</Text>
            </View>
          ) : null}

          {isInvalidFamilyId || isError || (!isLoading && !family) ? (
            <YStack gap={12} style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>
                {isInvalidFamilyId
                  ? "잘못된 가족 프로필 경로입니다."
                  : "가족 정보를 불러오지 못했습니다."}
              </Text>
              {!isInvalidFamilyId ? (
                <PillButton
                  variant="outline"
                  onPress={() => refetch()}
                  accessibilityLabel="가족 정보 다시 시도"
                  flex={0}
                >
                  <Text style={styles.retryText}>다시 시도</Text>
                </PillButton>
              ) : null}
            </YStack>
          ) : null}

          {!isLoading && !isInvalidFamilyId && !isError && family ? (
            <>
              <SurfaceCard style={styles.profileCard}>
                <YStack gap={14}>
                  <XStack items="center" justify="space-between" gap={12}>
                    <YStack gap={4} flex={1}>
                      <Text style={styles.name}>{family.name}</Text>
                      <Text style={styles.description}>
                        현재 표시 호칭은 {family.relation}입니다.
                      </Text>
                    </YStack>
                    <Badge
                      label={family.relation}
                      backgroundColor={palette.light_green}
                      textColor={palette.green_deep}
                    />
                  </XStack>
                </YStack>
              </SurfaceCard>

              <YStack gap={8}>
                <SectionHeader
                  icon={<Ionicons name="create-outline" size={16} color={palette.green} />}
                  title="가족 호칭"
                />
                <SurfaceCard style={styles.formCard}>
                  <YStack gap={10}>
                    <TextInput
                      value={relation}
                      onChangeText={setRelation}
                      maxLength={20}
                      placeholder="호칭을 입력하세요"
                      placeholderTextColor={palette.input_placeholder}
                      accessibilityLabel="가족 호칭 입력"
                      style={styles.input}
                    />
                    <PillButton
                      variant="solid"
                      disabled={!canSave}
                      onPress={handleSaveRelation}
                      accessibilityLabel="가족 호칭 저장"
                      backgroundColor={palette.green}
                    >
                      <Text style={styles.saveText}>
                        {updateRelationMutation.isPending ? "저장 중" : "저장"}
                      </Text>
                    </PillButton>
                  </YStack>
                </SurfaceCard>
              </YStack>

              <Pressable
                style={styles.deleteAction}
                accessibilityRole="button"
                accessibilityLabel="가족 연동 해제"
                onPress={handleDeleteFamily}
                disabled={deleteFamilyMutation.isPending}
              >
                <Ionicons name="trash-outline" size={14} color={palette.red_strong} />
                <Text style={styles.deleteActionText}>
                  {deleteFamilyMutation.isPending ? "해제 중" : "가족 연동 해제"}
                </Text>
              </Pressable>
            </>
          ) : null}
        </YStack>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  profileCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  formCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.black,
  },
  description: {
    fontSize: 13,
    color: palette.icon,
    lineHeight: 18,
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.dark_gray,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    color: palette.black,
    fontSize: 14,
  },
  feedbackContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 10,
  },
  feedbackText: { color: palette.black, fontSize: 14, fontWeight: "500", textAlign: "center" },
  retryText: { color: palette.green_deep, fontSize: 14, fontWeight: "700" },
  saveText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: "700",
  },
  deleteAction: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.red_strong,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  deleteActionText: {
    color: palette.red_strong,
    fontSize: 13,
    fontWeight: "700",
  },
});
