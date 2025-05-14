
export interface PatientData {
  dni?: string;
  phone?: string;
  email?: string;
  age?: string;
  [key: string]: string | undefined;
}

export interface Patient {
  id: string;
  name: string;
  dni?: string;
  phone?: string;
  email?: string;
  age?: string;
  firstConsultationDate?: string;
  consultationsCount?: number;
  lastConsultationDate?: string;
}

export interface PatientResponse {
  id?: string;
  error?: string;
}

export interface ConsultationRecord {
  id: string;
  patientName: string;
  dateTime: string;
  audioUrl?: string;
  transcription?: string;
  summary?: string;
  patientData?: PatientData;
  patientId?: string;
  status?: "completed" | "processing" | "failed";
}

export interface ConsultationFilter {
  startDate?: Date;
  endDate?: Date;
  patientId?: string;
  sortDescending?: boolean;
}
