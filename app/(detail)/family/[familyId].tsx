import { useLocalSearchParams } from "expo-router";

import { FamilyDetailScreen } from "@/components/domains/family";

function toFamilyId(value: string | string[] | undefined): number | null {
  if (!value) {
    return null;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : null;
}

export default function FamilyDetailRoute() {
  const params = useLocalSearchParams<{ familyId?: string | string[] }>();
  const familyId = toFamilyId(params.familyId);

  return <FamilyDetailScreen familyId={familyId} />;
}
