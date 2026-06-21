export interface PrescriptionMedicationItem {
  readonly medicationId: number;
  readonly atcCode: string;
  readonly drugName: string;
  readonly takeTimes: readonly string[];
  readonly mainIngredient: string;
  readonly hasWarning: boolean;
  readonly warningMessage?: string | null;
}

export interface PrescriptionListItem {
  readonly prescriptionId: number;
  readonly title: string;
  readonly medications: readonly PrescriptionMedicationItem[];
}

export interface PrescriptionsListResponse {
  readonly prescriptions: readonly PrescriptionListItem[];
}

export interface UpdatePrescriptionMedicationBody {
  readonly atcCode: string;
  readonly drugName: string;
  readonly takeTimes?: readonly string[];
}

export interface UpdatePrescriptionRequest {
  readonly title?: string;
  readonly medications?: readonly UpdatePrescriptionMedicationBody[];
}

export interface UpdatePrescriptionResponse {
  readonly prescriptionId: number;
  readonly title: string;
  readonly message: string;
}

export interface DeletePrescriptionResponse {
  readonly message: string;
}
