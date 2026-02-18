import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SoapData } from "@/types/soap"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Maps AI-generated section headers to SOAP fields.
// The AI prompt generates: DATOS PERSONALES, MOTIVO DE CONSULTA, ANTECEDENTES PERSONALES,
// ANTECEDENTES FAMILIARES, HÁBITOS, EXÁMENES COMPLEMENTARIOS PREVIOS, DIAGNÓSTICO PRESUNTIVO,
// INDICACIONES, EXÁMENES SOLICITADOS.
// We also support standard SOAP headers (SUBJETIVO, OBJETIVO, EVALUACIÓN, PLAN).
type SoapTarget =
  | 'subjective'
  | 'subjective_history'
  | 'objective'
  | 'objective_labs'
  | 'assessment'
  | 'plan'
  | 'plan_orders'
  | 'diagnosis'
  | 'lab'
  | 'datos_personales'
  | 'unknown'

function classifyHeader(header: string): SoapTarget {
  const h = header
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents

  // Order matters: more specific matches first

  // Subjective — chief complaint
  if (h.includes('motivo de consulta') || h.includes('motivo')) return 'subjective'
  if (h.includes('subjetivo') || h.includes('sintomas')) return 'subjective'

  // Subjective — history (appended to S)
  if (h.includes('antecedentes personales')) return 'subjective_history'
  if (h.includes('antecedentes familiares')) return 'subjective_history'
  if (h.includes('antecedentes')) return 'subjective_history'
  if (h.includes('habitos')) return 'subjective_history'

  // Datos personales (meta, shown as part of S if no dedicated UI)
  if (h.includes('datos personales')) return 'datos_personales'

  // Diagnosis — must be before "examen" check since both contain similar words
  if (h.includes('diagnostico') || h.includes('presuntivo')) return 'diagnosis'

  // Lab — explicit lab section
  if (h.includes('laboratorio')) return 'lab'

  // Objective — exámenes complementarios (labs + imaging)
  if (h.includes('examenes complementarios') || h.includes('estudios complementarios')) return 'objective'

  // Plan — exámenes solicitados (ordered tests, part of plan)
  if (h.includes('examenes solicitados') || h.includes('estudios solicitados')) return 'plan_orders'

  // Plan
  if (h.includes('indicaciones') || h.includes('plan') || h.includes('tratamiento')) return 'plan'

  // Objective — general
  if (h.includes('objetivo') || h.includes('examen fisico') || h.includes('signos')) return 'objective'

  // Assessment
  if (h.includes('evaluacion') || h.includes('assessment')) return 'assessment'

  return 'unknown'
}

function parseLabContent(content: string) {
  const labs: Array<{ parameter: string; result: string; reference?: string; unit?: string }> = []

  if (!content.includes('|') && !content.includes('\t')) return labs

  const separator = content.includes('|') ? '|' : '\t'
  const lines = content.split('\n').filter(line => line.trim() && line.includes(separator))

  // Skip header/separator rows
  const dataLines = lines.filter(line => {
    const stripped = line.replace(/[|\-\s:]/g, '')
    return stripped.length > 0 && !/^[-]+$/.test(line.replace(/[|\s]/g, ''))
  })

  // Skip first row if it looks like a header
  const startIndex = dataLines[0] && /par[aá]metro|resultado|estudio|referencia/i.test(dataLines[0]) ? 1 : 0

  for (let i = startIndex; i < dataLines.length; i++) {
    const cells = dataLines[i].split(separator).map(c => c.trim()).filter(Boolean)
    if (cells.length >= 2) {
      labs.push({
        parameter: cells[0],
        result: cells[1],
        reference: cells[2] || '',
        unit: '',
      })
    }
  }

  return labs
}

function appendText(existing: string | undefined, addition: string, label?: string): string {
  const prefix = label ? `${label}:\n` : ''
  const block = prefix + addition
  if (!existing) return block
  return existing + '\n\n' + block
}

export function parseTextToSoapData(text: string, patientName?: string): SoapData {
  const empty: SoapData = {
    meta: { patientName: patientName || '' },
    transcripcion: '',
    subjective: { chiefComplaint: '' },
    objective: { vitals: [], physicalExam: '', labs: [] },
    assessment: { impression: '' },
    plan: { treatment: '' },
    diagnosticoPresuntivo: '',
    alerts: []
  }

  if (!text) return empty

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
  }

  // Strip markdown formatting before splitting
  const cleaned = text
    .replace(/\*\*/g, '')        // remove bold **
    .replace(/^#{1,4}\s+/gm, '') // remove heading markers

  // Split on lines that look like section headers.
  // Matches: ALL CAPS, Title Case, or mixed — anything that ends with ":"
  // and starts at the beginning of a line after a newline.
  const sections = cleaned.split(/\n(?=[\p{Lu}][\p{L}\s]*:)/u)

  sections.forEach(section => {
    const trimmed = section.trim()
    if (!trimmed) return

    const lines = trimmed.split('\n')
    const headerLine = lines[0]
    // Extract header text (everything before the colon)
    const colonIndex = headerLine.indexOf(':')
    const header = colonIndex >= 0 ? headerLine.slice(0, colonIndex).trim() : ''
    // Content is everything after the header line, plus any text after the colon on the same line
    const afterColon = colonIndex >= 0 ? headerLine.slice(colonIndex + 1).trim() : ''
    const restLines = lines.slice(1).join('\n').trim()
    const content = afterColon ? (restLines ? afterColon + '\n' + restLines : afterColon) : restLines

    if (!header && !content) return

    const target = header ? classifyHeader(header) : 'unknown'

    switch (target) {
      case 'subjective':
        soapData.subjective!.chiefComplaint = appendText(
          soapData.subjective!.chiefComplaint || undefined,
          content
        )
        break

      case 'subjective_history':
        // Accumulate into chiefComplaint with sub-header
        soapData.subjective!.chiefComplaint = appendText(
          soapData.subjective!.chiefComplaint || undefined,
          content,
          header
        )
        break

      case 'datos_personales':
        // Show in subjective if present
        soapData.subjective!.chiefComplaint = appendText(
          undefined, // prepend — datos personales goes first
          content,
          'Datos Personales'
        ) + (soapData.subjective!.chiefComplaint ? '\n\n' + soapData.subjective!.chiefComplaint : '')
        break

      case 'objective': {
        // Check if content contains lab tables
        const labs = parseLabContent(content)
        if (labs.length > 0) {
          soapData.objective!.labs = labs
          // Also keep narrative text (lines without pipes)
          const narrative = content.split('\n')
            .filter(l => !l.includes('|') && !/^[-\s]+$/.test(l))
            .join('\n').trim()
          if (narrative) {
            soapData.objective!.studiesNarrative = appendText(
              soapData.objective!.studiesNarrative || undefined,
              narrative
            )
          }
        } else {
          soapData.objective!.physicalExam = appendText(
            soapData.objective!.physicalExam || undefined,
            content
          )
        }
        break
      }

      case 'objective_labs':
      case 'lab': {
        soapData.laboratorio = content
        const labs = parseLabContent(content)
        if (labs.length > 0) {
          soapData.objective!.labs = labs
        }
        break
      }

      case 'assessment':
        soapData.assessment!.impression = appendText(
          soapData.assessment!.impression || undefined,
          content
        )
        break

      case 'diagnosis':
        soapData.diagnosticoPresuntivo = content
        // Also use as assessment if assessment is empty
        if (!soapData.assessment!.impression) {
          soapData.assessment!.impression = content
        }
        break

      case 'plan':
        soapData.plan!.treatment = appendText(
          soapData.plan!.treatment || undefined,
          content
        )
        break

      case 'plan_orders':
        soapData.plan!.orders = content
        // Also append to treatment for display
        soapData.plan!.treatment = appendText(
          soapData.plan!.treatment || undefined,
          content,
          'Exámenes Solicitados'
        )
        break

      case 'unknown':
      default:
        // Fallback: assign to first empty SOAP slot
        if (!soapData.subjective!.chiefComplaint) {
          soapData.subjective!.chiefComplaint = trimmed
        } else if (!soapData.objective!.physicalExam) {
          soapData.objective!.physicalExam = trimmed
        } else if (!soapData.assessment!.impression) {
          soapData.assessment!.impression = trimmed
        } else if (!soapData.plan!.treatment) {
          soapData.plan!.treatment = trimmed
        }
        break
    }
  })

  return soapData
}
