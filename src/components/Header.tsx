
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, MicOff, User, LogOut } from "lucide-react";
import ApiKeyDialog from "./ApiKeyDialog";
import { groqApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Header = () => {
  const [apiDialogOpen, setApiDialogOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    // Verificar si hay una clave API almacenada
    const storedApiKey = localStorage.getItem("groqApiKey");
    if (storedApiKey) {
      groqApi.setApiKey(storedApiKey);
      setHasApiKey(true);
    } else {
      // Si no se encuentra la clave API en localStorage, intentar obtener la compartida
      const fetchSharedKey = async () => {
        const sharedKey = await groqApi.fetchSharedApiKey();
        if (sharedKey) {
          groqApi.setApiKey(sharedKey);
          setHasApiKey(true);
        } else {
          setApiDialogOpen(true);
        }
      };
      
      if (user) {
        fetchSharedKey();
      }
    }
  }, [user]);

  useEffect(() => {
    setHasApiKey(groqApi.hasApiKey());
  }, [apiDialogOpen]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <MicOff className="h-6 w-6 text-medical-600" />
          <h1 className="text-xl font-medium tracking-tight text-medical-900">ConsultSummary</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setApiDialogOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                {hasApiKey ? "API Configurada" : "Configurar API"}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">
                <User className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </Link>
            </Button>
          )}
        </div>
        
        <ApiKeyDialog open={apiDialogOpen} onOpenChange={setApiDialogOpen} />
      </div>
    </header>
  );
};

export default Header;
