export interface CreatePrescriptionMedication {
  readonly atcCode: string;
  readonly drugName: string;
  readonly takeTimes?: readonly string[];
}

export interface CreatePrescriptionRequest {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly medications: readonly CreatePrescriptionMedication[];
}

export interface PrescriptionAllergyWarning {
  readonly atcCode: string;
  readonly drugName: string;
  readonly conflictWith: string;
  readonly warningMessage: string;
}

export interface CreatePrescriptionResponse {
  readonly prescriptionId: number;
  readonly title: string;
  readonly message: string;
  readonly hasAllergyConflict: boolean;
  readonly allergyWarnings: readonly PrescriptionAllergyWarning[];
}

export interface DrugSearchItem {
  readonly atcCode: string;
  readonly drugName: string;
  readonly company: string;
}

export type AnalysisRiskLevel = "SAFE" | "CAUTION" | "DANGER";

export type AnalysisWarningType = "ALLERGY" | "INTERACTION";

export interface AnalyzeIngredientWarning {
  readonly type: AnalysisWarningType;
  readonly title: string;
  readonly message: string;
}

export interface AnalyzeIngredientMedication {
  readonly atcCode: string;
  readonly drugName: string;
  readonly riskLevel: AnalysisRiskLevel;
  readonly efficacy: readonly string[];
  readonly precautions: readonly string[];
  readonly warnings: readonly AnalyzeIngredientWarning[];
}

export interface AnalyzeIngredientsRequest {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly takeTimes: readonly string[];
  readonly medications: readonly CreatePrescriptionMedication[];
}

export interface AnalyzeIngredientsSummary {
  readonly safeCount: number;
  readonly cautionCount: number;
  readonly dangerCount: number;
}

export interface AnalyzeIngredientsResponse {
  readonly title: string;
  readonly analyzedMedicationCount: number;
  readonly summary: AnalyzeIngredientsSummary;
  readonly medications: readonly AnalyzeIngredientMedication[];
  readonly shouldConsultDoctor: boolean;
  readonly doctorConsultationMessage: string | null;
}
