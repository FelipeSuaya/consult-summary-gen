import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@/types";
import { getPatients, deletePatient } from "@/lib/patients";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  UserPlus, Search, Trash2, Phone, Mail, ChevronDown, 
  ChevronUp, Stethoscope, User, Calendar, SortDesc, SortAsc 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePatient } from "@/lib/patients";
import PatientConsultations from "@/components/PatientConsultations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DateFilter from "@/components/DateFilter";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PatientsListProps {
  onStartConsultation?: (patient: Patient) => void;
}

const PatientsList = ({
  onStartConsultation
}: PatientsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 'desc' para mostrar los más recientes primero
  
  const { toast } = useToast();
  
  const {
    data: patients = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['patients', startDate, endDate],
    queryFn: () => getPatients(startDate, endDate)
  });

  useEffect(() => {
    if (searchTerm.trim() === "") {
      // Ordenar pacientes según la fecha de primera consulta
      const sortedPatients = [...patients].sort((a, b) => {
        // Si ambos tienen fecha, comparamos normalmente
        if (a.firstConsultationDate && b.firstConsultationDate) {
          const dateA = new Date(a.firstConsultationDate);
          const dateB = new Date(b.firstConsultationDate);
          return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        }
        // Si solo uno tiene fecha, ese va primero
        if (a.firstConsultationDate) return sortOrder === 'desc' ? -1 : 1;
        if (b.firstConsultationDate) return sortOrder === 'desc' ? 1 : -1;
        // Si ninguno tiene fecha, ordenamos por nombre
        return a.name.localeCompare(b.name);
      });
      
      setFilteredPatients(sortedPatients);
    } else {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        patient.dni && patient.dni.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients, sortOrder]);

  const handleDeletePatient = async () => {
    if (patientToDelete) {
      const error = await deletePatient(patientToDelete);
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Paciente Eliminado",
          description: "El paciente ha sido eliminado correctamente"
        });
        refetch();
      }
      setPatientToDelete(null);
    }
  };

  const handleSavePatient = async () => {
    if (!editingPatient || !editingPatient.name.trim()) {
      toast({
        title: "Nombre Requerido",
        description: "Por favor ingrese el nombre del paciente",
        variant: "destructive"
      });
      return;
    }
    try {
      const result = await savePatient(editingPatient);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Paciente Guardado",
        description: "Los datos del paciente han sido guardados correctamente"
      });
      setShowNewPatientDialog(false);
      setEditingPatient(null);
      refetch();
    } catch (error) {
      console.error("Error al guardar paciente:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el paciente",
        variant: "destructive"
      });
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowNewPatientDialog(true);
  };

  const handleNewPatient = () => {
    setEditingPatient({
      id: "",
      name: "",
      dni: "",
      phone: "",
      age: "",
      email: "",
      notes: ""
    });
    setShowNewPatientDialog(true);
  };

  const togglePatientExpand = (patientId: string) => {
    if (expandedPatient === patientId) {
      setExpandedPatient(null);
    } else {
      setExpandedPatient(patientId);
    }
  };
  
  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };
  
  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
  };

  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Pacientes</CardTitle>
          <CardDescription>Cargando pacientes...</CardDescription>
        </CardHeader>
      </Card>;
  }

  if (error) {
    return <Card>
        <CardHeader>
          <CardTitle>Pacientes</CardTitle>
          <CardDescription className="text-red-500">
            Error al cargar los pacientes. Por favor, intenta de nuevo.
          </CardDescription>
        </CardHeader>
      </Card>;
  }

  return <Card className="shadow-lg border-none rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-medical-500 to-medical-600">
        <div>
          <CardTitle className="text-white text-2xl font-bold tracking-tight">Pacientes</CardTitle>
          <CardDescription className="text-white/90">
            {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} registrado{filteredPatients.length !== 1 ? 's' : ''}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleNewPatient} 
            variant="secondary" 
            className="bg-white/30 text-white hover:bg-white/40 transition-colors"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </Button>
        </div>
      </CardHeader>
      <CardContent className="bg-white/10 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-medical-400" />
              <Input 
                placeholder="Buscar paciente por nombre o DNI..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-8 border-medical-300 focus:ring-medical-500 transition-all text-medical-900 placeholder-medical-600"
              />
            </div>
            
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <DateFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onReset={resetFilters}
              />
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleSortOrder}
                className="ml-2 whitespace-nowrap"
              >
                {sortOrder === 'desc' ? (
                  <>
                    <SortDesc className="h-4 w-4 mr-1" /> Más recientes primero
                  </>
                ) : (
                  <>
                    <SortAsc className="h-4 w-4 mr-1" /> Más antiguos primero
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-4 text-medical-700 bg-medical-50 rounded-lg">
                No se encontraron pacientes con el criterio de búsqueda.
              </div>
            ) : (
              filteredPatients.map(patient => (
                <div 
                  key={patient.id} 
                  className="border border-medical-200 rounded-lg p-4 transition-all hover:shadow-sm bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" alt={patient.name} />
                        <AvatarFallback className="bg-medical-100 text-medical-700">
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-medical-900">{patient.name}</h3>
                        {patient.dni && <p className="text-sm text-medical-700">DNI: {patient.dni}</p>}
                        {patient.firstConsultationDate && (
                          <div className="flex items-center text-xs text-medical-600 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            Primera consulta: {format(new Date(patient.firstConsultationDate), "dd MMM yyyy", { locale: es })}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-medical-800">
                          {patient.phone && (
                            <div className="flex items-center bg-medical-100 px-2 py-1 rounded-full">
                              <Phone className="h-3.5 w-3.5 mr-1 text-medical-700" />
                              {patient.phone}
                            </div>
                          )}
                          {patient.email && (
                            <div className="flex items-center bg-medical-100 px-2 py-1 rounded-full">
                              <Mail className="h-3.5 w-3.5 mr-1 text-medical-700" />
                              {patient.email}
                            </div>
                          )}
                          {patient.age && (
                            <div className="flex items-center bg-medical-100 px-2 py-1 rounded-full">
                              Edad: {patient.age}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {onStartConsultation && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onStartConsultation(patient)} 
                          className="text-medical-700 border-medical-300 hover:bg-medical-50"
                        >
                          <Stethoscope className="mr-2 h-4 w-4" />
                          Nueva Consulta
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditPatient(patient)}
                        className="text-medical-700 border-medical-300 hover:bg-medical-50"
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setPatientToDelete(patient.id)}
                        className="text-red-700 border-red-300 bg-red-50 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-700" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => togglePatientExpand(patient.id)} 
                      className="text-sm flex items-center -ml-2 text-medical-700 hover:bg-medical-50"
                    >
                      {expandedPatient === patient.id ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Ocultar historial
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Ver historial de consultas
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {expandedPatient === patient.id && (
                    <div className="mt-4 pt-4 border-t border-medical-100">
                      <PatientConsultations patientId={patient.id} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingPatient?.id ? "Editar Paciente" : "Crear Nuevo Paciente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input id="name" value={editingPatient?.name || ""} onChange={e => setEditingPatient(prev => prev ? {
              ...prev,
              name: e.target.value
            } : null)} placeholder="Nombre y apellidos" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dni">DNI/Documento</Label>
              <Input id="dni" value={editingPatient?.dni || ""} onChange={e => setEditingPatient(prev => prev ? {
              ...prev,
              dni: e.target.value
            } : null)} placeholder="Número de documento" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={editingPatient?.phone || ""} onChange={e => setEditingPatient(prev => prev ? {
                ...prev,
                phone: e.target.value
              } : null)} placeholder="Número de teléfono" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">Edad</Label>
                <Input id="age" value={editingPatient?.age || ""} onChange={e => setEditingPatient(prev => prev ? {
                ...prev,
                age: e.target.value
              } : null)} placeholder="Edad" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={editingPatient?.email || ""} onChange={e => setEditingPatient(prev => prev ? {
              ...prev,
              email: e.target.value
            } : null)} placeholder="Correo electrónico" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" value={editingPatient?.notes || ""} onChange={e => setEditingPatient(prev => prev ? {
              ...prev,
              notes: e.target.value
            } : null)} placeholder="Notas adicionales sobre el paciente" rows={3} />
            </div>
            <Button type="button" onClick={handleSavePatient}>
              Guardar Paciente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!patientToDelete} onOpenChange={open => !open && setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el paciente seleccionado y todas sus consultas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
};

export default PatientsList;
