import type { AllergyItem } from "./user";

/** GET /api/v1/families 목록 항목 */
export type FamilySummary = {
  familyId: number;
  name: string;
  relation: string;
  birthDate: string;
  gender: "M" | "F";
};

/** GET /api/v1/families/requests/received 목록 항목 */
export type ReceivedFamilyRequest = {
  requestId: number;
  senderId: number;
  senderName: string;
  proposedRelation: string;
  status: string;
  requestedAt: string;
};

/** GET /api/v1/families/{familyId} 응답 */
export type FamilyDetail = {
  familyId: number;
  name: string;
  relation: string;
  birthDate: string;
  gender: "M" | "F";
  height: number;
  weight: number;
  bloodType: string;
  diseases: string[];
  allergies: AllergyItem[];
  isAlertConsent: boolean;
};

/** GET /api/v1/families/manage 응답 */
export type FamilyManageMember = {
  id: string;
  name: string;
  relation: string;
  emoji: string;
  isActive: boolean;
};

export type PendingFamilyInviteItem = {
  id: string;
  relation: string;
  email: string;
  invitedAt: string;
};

export type FamilyManageOverview = {
  inviteLink: string;
  members: FamilyManageMember[];
  pendingInvites: PendingFamilyInviteItem[];
};
