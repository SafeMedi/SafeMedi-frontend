export interface ScanMedicationItem {
  readonly atcCode: string;
  readonly drugName: string;
}

export interface ScanPrescriptionDraft {
  readonly title: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly takeTimes: readonly string[];
  readonly medications: readonly ScanMedicationItem[];
  readonly rawText: string;
}

export interface PrescriptionScanViewModel {
  readonly draft: ScanPrescriptionDraft | null;
  readonly draftJson: string;
  readonly isExtracting: boolean;
  readonly isSubmitting: boolean;
  readonly isManualInputVisible: boolean;
  readonly error: Error | null;
  readonly selectedImageUri: string | null;
  readonly extractFromGallery: () => Promise<void>;
  readonly extractFromCamera: () => Promise<void>;
  readonly submitDraft: () => Promise<void>;
  readonly retryExtract: () => Promise<void>;
  readonly openManualInput: () => void;
  readonly closeManualInput: () => void;
  readonly updateManualJson: (value: string) => void;
  readonly applyManualJson: () => void;
  readonly resetError: () => void;
}
