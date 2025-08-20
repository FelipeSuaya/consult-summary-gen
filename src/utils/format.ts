
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const formatVital = (label: string, value: string, unit?: string): string => {
  return `${label}: ${value}${unit ? ` ${unit}` : ''}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export const generatePlainTextSummary = (data: any): string => {
  let summary = '';
  
  if (data.meta?.patientName) {
    summary += `PACIENTE: ${data.meta.patientName}`;
    if (data.meta.age) summary += ` (${data.meta.age})`;
    if (data.meta.id) summary += ` - ID: ${data.meta.id}`;
    summary += '\n';
  }
  
  if (data.meta?.dateTime) {
    summary += `FECHA: ${formatDate(data.meta.dateTime)}\n`;
  }
  
  if (data.meta?.clinician) {
    summary += `PROFESIONAL: ${data.meta.clinician}\n`;
  }
  
  summary += '\n--- RESUMEN SOAP ---\n\n';
  
  if (data.subjective) {
    summary += 'S - SUBJETIVO:\n';
    if (data.subjective.chiefComplaint) {
      summary += `Motivo de consulta: ${data.subjective.chiefComplaint}\n`;
    }
    if (data.subjective.hpi) {
      summary += `Historia actual: ${data.subjective.hpi}\n`;
    }
    summary += '\n';
  }
  
  if (data.objective) {
    summary += 'O - OBJETIVO:\n';
    if (data.objective.vitals?.length) {
      summary += 'Signos vitales: ';
      summary += data.objective.vitals.map((v: any) => formatVital(v.label, v.value, v.unit)).join(', ');
      summary += '\n';
    }
    if (data.objective.physicalExam) {
      summary += `Examen físico: ${data.objective.physicalExam}\n`;
    }
    summary += '\n';
  }
  
  if (data.assessment) {
    summary += 'A - EVALUACIÓN:\n';
    if (data.assessment.impression) {
      summary += `${data.assessment.impression}\n`;
    }
    summary += '\n';
  }
  
  if (data.plan) {
    summary += 'P - PLAN:\n';
    if (data.plan.treatment) {
      summary += `Tratamiento: ${data.plan.treatment}\n`;
    }
    if (data.plan.orders) {
      summary += `Estudios: ${data.plan.orders}\n`;
    }
    if (data.plan.followUp) {
      summary += `Seguimiento: ${data.plan.followUp}\n`;
    }
    summary += '\n';
  }
  
  return summary;
};
