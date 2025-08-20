
import { formatDate } from "@/utils/format";

interface PrintHeaderProps {
  patientName?: string;
  age?: string;
  id?: string;
  dateTime?: string;
  clinician?: string;
  version?: string;
}

const PrintHeader = ({ patientName, age, id, dateTime, clinician, version }: PrintHeaderProps) => {
  return (
    <div className="print:block hidden border-b pb-4 mb-6">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">RESUMEN CLÍNICO - FORMATO SOAP</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="mb-1">
            <span className="font-medium">Paciente:</span> {patientName || 'No especificado'}
          </div>
          <div className="mb-1">
            <span className="font-medium">Edad:</span> {age || 'No especificada'}
          </div>
          <div>
            <span className="font-medium">ID:</span> {id || 'No especificado'}
          </div>
        </div>
        <div>
          <div className="mb-1">
            <span className="font-medium">Fecha:</span> {formatDate(dateTime)}
          </div>
          <div className="mb-1">
            <span className="font-medium">Profesional:</span> {clinician || 'No especificado'}
          </div>
          <div>
            <span className="font-medium">Versión:</span> {version || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
