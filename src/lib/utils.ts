import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SoapData } from "@/types/soap"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseTextToSoapData(text: string, patientName?: string): SoapData {
  if (!text) {
    return {
      meta: { patientName: patientName || '' },
      transcripcion: '',
      subjective: { chiefComplaint: '' },
      objective: { vitals: [], physicalExam: '', labs: [] },
      assessment: { impression: '' },
      plan: { treatment: '' },
      diagnosticoPresuntivo: '',
      alerts: []
    };
  }

  const soapData: SoapData = {
    meta: { patientName: patientName || '' },
    transcripcion: '',
    subjective: { chiefComplaint: '' },
    objective: { vitals: [], physicalExam: '', studiesNarrative: '', labs: [] },
    assessment: { impression: '', differentials: [], notes: '' },
    plan: { treatment: '', recommendations: '', orders: '', referrals: '', followUp: '' },
    diagnosticoPresuntivo: '',
    laboratorio: '',
    alerts: []
  };

  // Parse sections from text
  const sections = text.split(/\n(?=[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]*:)/);
  
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const firstLine = lines[0].toLowerCase();
    const content = lines.slice(1).join('\n').trim();

    if (firstLine.includes('subjetivo') || firstLine.includes('motivo') || firstLine.includes('síntomas')) {
      soapData.subjective!.chiefComplaint = content;
    } else if (firstLine.includes('objetivo') || firstLine.includes('examen') || firstLine.includes('signos')) {
      if (firstLine.includes('vital') || content.includes('presión') || content.includes('temperatura')) {
        // Parse vitals from text into structured format
        const vitalLines = content.split('\n');
        soapData.objective!.vitals = vitalLines
          .filter(line => line.trim())
          .map(line => {
            const parts = line.split(':').map(p => p.trim());
            return {
              label: parts[0] || 'Vital',
              value: parts[1] || line,
              unit: ''
            };
          });
      } else if (firstLine.includes('laboratorio') || content.includes('|')) {
        soapData.laboratorio = content;
        // Parse lab tables
        if (content.includes('|')) {
          const labRows = content.split('\n').filter(line => line.includes('|'));
          soapData.objective!.labs = labRows.map(row => {
            const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
            return {
              parameter: cells[0] || 'Parámetro',
              result: cells[1] || 'Resultado',
              reference: cells[2] || '',
              unit: ''
            };
          });
        }
      } else {
        soapData.objective!.physicalExam = content;
      }
    } else if (firstLine.includes('evaluación') || firstLine.includes('assessment') || firstLine.includes('evaluacion')) {
      soapData.assessment!.impression = content;
    } else if (firstLine.includes('plan') || firstLine.includes('tratamiento') || firstLine.includes('indicaciones')) {
      soapData.plan!.treatment = content;
    } else if (firstLine.includes('diagnóstico') || firstLine.includes('diagnostico') || firstLine.includes('presuntivo')) {
      soapData.diagnosticoPresuntivo = content;
    } else if (firstLine.includes('laboratorio')) {
      soapData.laboratorio = content;
    } else {
      // If no specific section match, treat as general content
      if (!soapData.subjective!.chiefComplaint) {
        soapData.subjective!.chiefComplaint = section;
      } else if (!soapData.objective!.physicalExam) {
        soapData.objective!.physicalExam = section;
      } else if (!soapData.assessment!.impression) {
        soapData.assessment!.impression = section;
      } else if (!soapData.plan!.treatment) {
        soapData.plan!.treatment = section;
      }
    }
  });

  return soapData;
}
