
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@/types";
import { getPatients, deletePatient } from "@/lib/patients";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Search, Trash2, Phone, Mail, ChevronDown, ChevronUp, Stethoscope, User, Calendar, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePatient } from "@/lib/patients";
import PatientConsultations from "@/components/PatientConsultations";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import DateFilter from "@/components/DateFilter";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PatientsListProps {
  onStartConsultation?: (patient: Patient) => void;
}

const PatientsList = ({ onStartConsultation }: PatientsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sortByDateAscending, setSortByDateAscending] = useState<boolean>(false);
  
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
      let sortedPatients = [...patients];
      
      if (sortByDateAscending) {
        sortedPatients.sort((a, b) => {
          if (!a.firstConsultationDate) return 1;
          if (!b.firstConsultationDate) return -1;
          return new Date(a.firstConsultationDate).getTime() - new Date(b.firstConsultationDate).getTime();
        });
      } else {
        sortedPatients.sort((a, b) => {
          if (!a.firstConsultationDate) return 1;
          if (!b.firstConsultationDate) return -1;
          return new Date(b.firstConsultationDate).getTime() - new Date(a.firstConsultationDate).getTime();
        });
      }
      
      setFilteredPatients(sortedPatients);
    } else {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (patient.dni && patient.dni.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients, sortByDateAscending]);

  const handleDeletePatient = async () => {
    if (patientToDelete) {
      const error = await deletePatient(patientToDelete);
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        toast({ title: "Paciente eliminado", description: "El paciente ha sido eliminado correctamente" });
        refetch();
      }
      setPatientToDelete(null);
    }
  };

  const handleSavePatient = async () => {
    if (!editingPatient || !editingPatient.name.trim()) {
      toast({ title: "Nombre requerido", description: "Por favor ingrese el nombre del paciente", variant: "destructive" });
      return;
    }
    try {
      const result = await savePatient(editingPatient);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Guardado", description: "Datos del paciente guardados correctamente" });
      setShowNewPatientDialog(false);
      setEditingPatient(null);
      refetch();
    } catch (error) {
      console.error("Error al guardar paciente:", error);
      toast({ title: "Error", description: "No se pudo guardar el paciente", variant: "destructive" });
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowNewPatientDialog(true);
  };

  const handleNewPatient = () => {
    setEditingPatient({ id: "", name: "", dni: "", phone: "", age: "", email: "", notes: "" });
    setShowNewPatientDialog(true);
  };

  const togglePatientExpand = (patientId: string) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId);
  };

  const handleDateChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Cargando pacientes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8">
        <p className="text-sm text-destructive text-center">Error al cargar los pacientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o DNI..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="pl-9 h-9 bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <DateFilter 
            onDateChange={handleDateChange} 
            onSortToggle={() => setSortByDateAscending(!sortByDateAscending)}
            sortAscending={sortByDateAscending}
            showSortToggle={true}
          />
          <Button onClick={handleNewPatient} size="sm" className="h-9 gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Nuevo
          </Button>
        </div>
      </div>

      {/* Patient count */}
      <p className="text-xs text-muted-foreground">
        {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
      </p>

      {/* Patient List */}
      <div className="space-y-2">
        {filteredPatients.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <User className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No se encontraron pacientes</p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <div 
              key={patient.id} 
              className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">
                      {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{patient.name}</h3>
                    {patient.dni && <p className="text-xs text-muted-foreground">DNI: {patient.dni}</p>}
                    
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {patient.age && (
                        <span className="inline-flex items-center text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {patient.age} años
                        </span>
                      )}
                      {patient.phone && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </span>
                      )}
                      {patient.email && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </span>
                      )}
                      {patient.firstConsultationDate && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(patient.firstConsultationDate), "dd/MM/yy", { locale: es })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {onStartConsultation && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onStartConsultation(patient)} 
                      className="h-8 px-2.5 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditPatient(patient)}
                    className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setPatientToDelete(patient.id)}
                    className="h-8 px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              <button 
                onClick={() => togglePatientExpand(patient.id)} 
                className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expandedPatient === patient.id ? (
                  <><ChevronUp className="h-3.5 w-3.5" /> Ocultar historial</>
                ) : (
                  <><ChevronDown className="h-3.5 w-3.5" /> Ver historial</>
                )}
              </button>
              
              {expandedPatient === patient.id && (
                <div className="mt-3 pt-3 border-t border-border/50 animate-fade-in">
                  <PatientConsultations 
                    patientId={patient.id} 
                    patientName={patient.name}
                    patientAge={patient.age}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New/Edit Patient Dialog */}
      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingPatient?.id ? "Editar Paciente" : "Nuevo Paciente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input id="name" value={editingPatient?.name || ""} onChange={e => setEditingPatient(prev => prev ? { ...prev, name: e.target.value } : null)} placeholder="Nombre y apellidos" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dni">DNI/Documento</Label>
              <Input id="dni" value={editingPatient?.dni || ""} onChange={e => setEditingPatient(prev => prev ? { ...prev, dni: e.target.value } : null)} placeholder="Número de documento" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={editingPatient?.phone || ""} onChange={e => setEditingPatient(prev => prev ? { ...prev, phone: e.target.value } : null)} placeholder="Teléfono" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">Edad</Label>
                <Input id="age" value={editingPatient?.age || ""} onChange={e => setEditingPatient(prev => prev ? { ...prev, age: e.target.value } : null)} placeholder="Edad" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={editingPatient?.email || ""} onChange={e => setEditingPatient(prev => prev ? { ...prev, email: e.target.value } : null)} placeholder="Email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" value={editingPatient?.notes || ""} onChange={e => setEditingPatient(prev => prev ? { ...prev, notes: e.target.value } : null)} placeholder="Notas sobre el paciente" rows={3} />
            </div>
            <Button type="button" onClick={handleSavePatient}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!patientToDelete} onOpenChange={open => !open && setPatientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al paciente y todas sus consultas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PatientsList;
