'use client'

import { useState, useEffect, useMemo } from "react";
import { Patient } from "@/types";
import { usePatientsModule } from '@/modules/patients/hooks/use-patients'
import { useSearchPatients } from '@/modules/patients/hooks/use-patient-queries'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface PatientSelectorProps {
  onPatientSelect: (patient: Patient) => void;
  selectedPatientId?: string;
  initialPatientName?: string;
}

const PatientSelector = ({ onPatientSelect, selectedPatientId, initialPatientName }: PatientSelectorProps) => {
  const { patients, isLoading, createPatient } = usePatientsModule();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [newPatient, setNewPatient] = useState<Omit<Patient, "id">>({
    name: initialPatientName || "",
    dni: "",
    phone: "",
    age: "",
    email: "",
    notes: ""
  });
  const { toast } = useToast();

  const { data: searchResults } = useSearchPatients(searchQuery);

  // Derive filtered patients from search results or full list
  const filteredPatients = useMemo(() => {
    if (searchQuery.trim() === "") {
      return patients;
    }
    if (searchQuery.length >= 2 && searchResults) {
      return searchResults;
    }
    return patients;
  }, [searchQuery, patients, searchResults]);

  // Auto-select patient when selectedPatientId is provided and patients load
  useEffect(() => {
    if (selectedPatientId && patients.length > 0) {
      const selectedPatient = patients.find(p => p.id === selectedPatientId);
      if (selectedPatient) {
        onPatientSelect(selectedPatient);
      }
    }
  }, [selectedPatientId, patients, onPatientSelect]);

  const handleCreatePatient = async () => {
    if (!newPatient.name.trim()) {
      toast({
        title: "Nombre Requerido",
        description: "Por favor ingrese el nombre del paciente",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createPatient.mutateAsync(newPatient);

      // After mutation success, patients query is auto-invalidated.
      // The returned result contains the id of the created patient.
      if (result.id) {
        // We need to find the patient in the updated list, but since the query
        // invalidation is async, we construct a temporary patient for immediate selection.
        const createdPatient: Patient = {
          id: result.id,
          name: newPatient.name,
          dni: newPatient.dni,
          phone: newPatient.phone,
          age: newPatient.age,
          email: newPatient.email,
          notes: newPatient.notes,
        };
        onPatientSelect(createdPatient);
      }

      toast({
        title: "Paciente Creado",
        description: "El paciente ha sido registrado correctamente",
      });

      setShowNewPatientDialog(false);

      // Reiniciamos el formulario
      setNewPatient({
        name: "",
        dni: "",
        phone: "",
        age: "",
        email: "",
        notes: ""
      });
    } catch (error) {
      console.error("Error al crear paciente:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el paciente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar paciente por nombre o DNI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Paciente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="Nombre y apellidos"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dni">DNI/Documento</Label>
                <Input
                  id="dni"
                  value={newPatient.dni || ""}
                  onChange={(e) => setNewPatient({ ...newPatient, dni: e.target.value })}
                  placeholder="Número de documento"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={newPatient.phone || ""}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="Número de teléfono"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="age">Edad</Label>
                  <Input
                    id="age"
                    value={newPatient.age || ""}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    placeholder="Edad"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email || ""}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  placeholder="Correo electrónico"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={newPatient.notes || ""}
                  onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
                  placeholder="Notas adicionales sobre el paciente"
                  rows={3}
                />
              </div>
              <Button type="button" onClick={handleCreatePatient}>
                Guardar Paciente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Cargando pacientes...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No se encontraron pacientes.{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={() => setShowNewPatientDialog(true)}
          >
            Crear un nuevo paciente
          </Button>
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className={`p-3 cursor-pointer hover:bg-gray-50 ${
                selectedPatientId === patient.id ? "bg-gray-100" : ""
              }`}
              onClick={() => onPatientSelect(patient)}
            >
              <div className="font-medium">{patient.name}</div>
              <div className="text-sm text-gray-500 flex flex-wrap gap-x-4">
                {patient.dni && <span>DNI: {patient.dni}</span>}
                {patient.age && <span>Edad: {patient.age}</span>}
                {patient.phone && <span>Tel: {patient.phone}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientSelector;
