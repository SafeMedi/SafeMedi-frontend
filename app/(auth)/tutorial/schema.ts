import { z } from "zod";
import { BLOOD_TYPES, GENDERS } from "@/constants/health-profile-options";

export const tutorialStep1Schema = z.object({
  height: z
    .string()
    .trim()
    .min(1, "키를 입력해 주세요")
    .refine((val) => {
      const n = Number(val.replace(",", "."));
      return !Number.isNaN(n) && n >= 50 && n <= 250;
    }, "50~250cm 사이로 입력해 주세요"),
  weight: z
    .string()
    .trim()
    .min(1, "몸무게를 입력해 주세요")
    .refine((val) => {
      const n = Number(val.replace(",", "."));
      return !Number.isNaN(n) && n >= 20 && n <= 300;
    }, "20~300kg 사이로 입력해 주세요"),
  bloodType: z.enum(BLOOD_TYPES, { message: "혈액형을 선택해 주세요" }),
  gender: z.enum(GENDERS, { message: "성별을 선택해 주세요" }),
});

export type TutorialStep1FormValues = z.infer<typeof tutorialStep1Schema>;
