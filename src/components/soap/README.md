
# Componente SOAP Summary

Sistema completo para visualización de resúmenes clínicos en formato SOAP (Subjective, Objective, Assessment, Plan).

## Uso básico

```tsx
import SoapSummary from "@/components/soap/SoapSummary";
import { SoapData } from "@/types/soap";

const soapData: SoapData = {
  meta: {
    patientName: "APELLIDO, Nombre",
    age: "45 años",
    id: "DNI: 12345678",
    dateTime: "2024-01-15T14:30:00.000Z",
    clinician: "Dr./Dra. Apellido",
    source: "MD", // "AI" | "MD"
    version: "v1.2"
  },
  subjective: {
    chiefComplaint: "Motivo de consulta",
    hpi: "Historia de la enfermedad actual...",
    // ... otros campos opcionales
  },
  // ... otras secciones
};

function MyComponent() {
  return <SoapSummary soapData={soapData} />;
}
```

## Características principales

- **Responsive**: Layout adaptativo para desktop y mobile
- **Impresión**: Optimizado para impresión/exportación PDF
- **Accesibilidad**: Cumple estándares AA/AAA
- **Interacciones**: Copiar secciones, colapsar, navegación rápida
- **Theming**: Soporte para modo claro/oscuro

## Estructura de datos (SoapData)

Ver `src/types/soap.ts` para el esquema completo de TypeScript.

### Secciones principales:

- `meta`: Información del paciente y consulta
- `subjective`: Datos subjetivos (síntomas, antecedentes)
- `objective`: Datos objetivos (signos vitales, examen físico, laboratorio)
- `assessment`: Evaluación diagnóstica
- `plan`: Plan de tratamiento y seguimiento
- `aiPresumptiveDx`: Diagnóstico presuntivo de IA (opcional)

## Componentes incluidos

- `SoapSummary`: Componente principal
- `HeaderBar`: Barra superior con acciones
- `SectionCard`: Tarjeta para cada sección SOAP
- `KeyChips`: Componente para signos vitales
- `LabTable`: Tabla de resultados de laboratorio
- `PrintHeader`: Encabezado para impresión

## Funcionalidades

### Interacciones
- Copiar texto completo o por secciones
- Expandir/colapsar secciones
- Imprimir/exportar a PDF
- Navegación rápida (botones S-O-A-P)

### Accesibilidad
- Navegación por teclado completa
- Roles ARIA apropiados
- Contraste de colores optimizado
- Soporte para lectores de pantalla

### Responsive
- Grid de 12 columnas en desktop
- Stack vertical en mobile
- Tipografías escalables
- Tablas con scroll horizontal

## Estilos y personalización

El componente utiliza:
- Tailwind CSS para estilos
- shadcn/ui para componentes base
- Lucide React para iconografía
- Tokens de design system coherentes

## Demo

Ver `src/pages/SoapSummaryPage.tsx` para un ejemplo completo con datos de muestra.
