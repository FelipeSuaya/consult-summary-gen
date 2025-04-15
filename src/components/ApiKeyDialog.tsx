
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
      try {
        // Obtener el total de usuarios
        const { count, error } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.error("Error checking admin status:", error);
          return;
        }
        
        // Obtener el ID del usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // El primer usuario registrado o el usuario con ID específico es admin
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
          
        // El usuario es admin si es el primero que se registró
        if (userProfile && (userProfile.id === user.id || count === 1)) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
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
        // Verificar si ya existe un registro para 'groq'
        const { data, error: checkError } = await supabase
          .from('shared_api_keys')
          .select('*')
          .eq('service_name', 'groq')
          .maybeSingle();
          
        if (checkError) {
          throw new Error(checkError.message);
        }
        
        let upsertError;
        
        if (data) {
          // Actualizar el registro existente
          const { error } = await supabase
            .from('shared_api_keys')
            .update({ api_key: apiKey.trim() })
            .eq('service_name', 'groq');
          upsertError = error;
        } else {
          // Insertar un nuevo registro
          const { error } = await supabase
            .from('shared_api_keys')
            .insert({ service_name: 'groq', api_key: apiKey.trim() });
          upsertError = error;
        }
        
        if (upsertError) {
          throw new Error(upsertError.message);
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
        description: "No se pudo guardar la clave API: " + (error instanceof Error ? error.message : "Error desconocido"),
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
