import { type Href, router } from "expo-router";
import { useMemo } from "react";

import { useFamilyProfiles } from "@/api/queries/profile";
import { useLogout } from "@/hooks/use-logout";
import { useHealthInfo, useProfileUser } from "@/stores/userStore";
import type { FamilyProfile } from "./components/FamilyProfileSection";
import { FAMILY_AVATAR_GRADIENTS } from "./constants";

const APP_VERSION = "v1.0.0";
const AVATAR_GRADIENT_POOL = [
  FAMILY_AVATAR_GRADIENTS.purple,
  FAMILY_AVATAR_GRADIENTS.green,
] as const;

export function useProfileViewModel() {
  const handleLogout = useLogout();

  const profileUser = useProfileUser();
  const { data: familySummaries = [] } = useFamilyProfiles();
  const { allergies, chronicConditions } = useHealthInfo();

  const familyProfiles = useMemo<FamilyProfile[]>(() => {
    const me: FamilyProfile = {
      id: "me",
      name: profileUser.name,
      isActive: true,
      avatarGradient: FAMILY_AVATAR_GRADIENTS.green,
    };
    const members = familySummaries.map((family, index) => ({
      id: String(family.familyId),
      name: family.name,
      isActive: false,
      avatarGradient: AVATAR_GRADIENT_POOL[index % AVATAR_GRADIENT_POOL.length],
    }));

    return [me, ...members];
  }, [familySummaries, profileUser.name]);

  const appInfoItems = useMemo(
    () => [
      { id: "app-info", label: "앱 정보", trailingText: APP_VERSION },
      { id: "terms", label: "이용약관" },
      { id: "privacy-policy", label: "개인정보 처리방침" },
    ],
    [],
  );

  const handleOpenProfileEdit = () => {
    router.push("/profile/edit");
  };

  const handleOpenFamilyManage = () => {
    router.push("/family/manage");
  };

  const handleOpenHealthInfoDetail = () => {
    router.push("/profile/health-info");
  };

  const handleSelectFamilyProfile = (profileId: string) => {
    if (profileId === "me") {
      return;
    }
    const familyId = Number(profileId);
    if (!Number.isInteger(familyId)) {
      return;
    }
    const familyDetailHref = `/(detail)/family/${familyId}` as Href;
    router.push(familyDetailHref);
  };

  return {
    profileUser,
    familyProfiles,
    allergies,
    chronicConditions,
    appInfoItems,
    handleLogout,
    handleOpenProfileEdit,
    handleOpenFamilyManage,
    handleOpenHealthInfoDetail,
    handleSelectFamilyProfile,
  };
}
