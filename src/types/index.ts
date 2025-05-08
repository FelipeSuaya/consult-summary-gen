
export interface ConsultationRecord {
  id: string;
  patientName: string;
  dateTime: string;
  audioUrl?: string;
  transcription?: string;
  summary?: string;
  patientData?: {
    dni?: string;
    phone?: string;
    age?: string;
    email?: string;
  };
  patientId?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface Patient {
  id: string;
  name: string;
  dni?: string;
  phone?: string;
  age?: string;
  email?: string;
  notes?: string;
  firstConsultationDate?: string;
}
