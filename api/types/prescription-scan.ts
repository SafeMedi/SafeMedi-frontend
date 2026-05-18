export interface CreatePrescriptionMedication {
  readonly atcCode: string;
  readonly drugName: string;
  readonly dosage?: string;
  readonly takeTimes?: readonly string[];
}

export interface CreatePrescriptionRequest {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly takeTimes: readonly string[];
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
