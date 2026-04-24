import { z } from "zod";
import { BLOOD_TYPES, GENDERS, RH_FACTORS } from "@/constants/health-profile-options";

export const profileEditSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "닉네임을 입력해주세요.")
    .max(20, "닉네임은 20자 이하로 입력해주세요."),
  gender: z.enum(GENDERS, { message: "성별을 선택해주세요." }),
  bloodType: z.enum(BLOOD_TYPES, { message: "혈액형을 선택해주세요." }),
  rhFactor: z.enum(RH_FACTORS, { message: "Rh 타입을 선택해주세요." }),
  allergies: z.array(z.string().trim().min(1)),
  chronicConditions: z.array(z.string().trim().min(1)),
  allergyInput: z.string(),
  chronicInput: z.string(),
});

export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;
