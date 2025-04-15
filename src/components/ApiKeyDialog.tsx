
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { groqApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeyDialog = ({ open, onOpenChange }: ApiKeyDialogProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Aquí podrías implementar una lógica para determinar si el usuario es administrador
      // Por simplicidad, vamos a permitir que solo el primer usuario registrado pueda cambiar la API key
      const { count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      // El primer usuario o si no hay usuarios aún será considerado admin
      if (count === 1 || count === 0) {
        setIsAdmin(true);
      }
    };
    
    if (open) {
      checkAdminStatus();
      
      // Cargar la clave API actual
      const loadApiKey = async () => {
        const currentKey = await groqApi.fetchSharedApiKey();
        if (currentKey) {
          setApiKey(currentKey);
        }
      };
      
      loadApiKey();
    }
  }, [open]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Clave API requerida",
        description: "Por favor ingresa la clave API de Groq.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Si el usuario es administrador, actualizar la clave API compartida
      if (isAdmin) {
        const { error } = await supabase
          .from('shared_api_keys')
          .update({ api_key: apiKey.trim() })
          .eq('service_name', 'groq');
        
        if (error) {
          throw new Error(error.message);
        }
      }
      
      // En cualquier caso, establecer la clave API para uso local
      groqApi.setApiKey(apiKey.trim());
      
      toast({
        title: "Éxito",
        description: isAdmin 
          ? "Clave API guardada y actualizada para todos los usuarios" 
          : "Clave API configurada para esta sesión",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la clave API",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clave API de Groq</DialogTitle>
          <DialogDescription>
            {isAdmin 
              ? "Como administrador, puedes actualizar la clave API compartida que será usada por todos los usuarios." 
              : "Esta clave API es compartida entre todos los usuarios del sistema."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-y-2 py-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="apiKey" className="sr-only">
              Clave API
            </Label>
            <Input
              id="apiKey"
              placeholder="Ingresa la clave API de Groq"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              readOnly={!isAdmin}
            />
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">
                Solo los administradores pueden modificar la clave API compartida.
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {isAdmin && (
            <Button type="button" onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar clave API"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
