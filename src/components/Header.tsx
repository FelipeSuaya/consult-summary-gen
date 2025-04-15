
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Stethoscope, User, LogOut } from "lucide-react";
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

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-gradient-to-r from-medical-600 to-medical-800 backdrop-blur-md shadow-md">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group transition-all duration-300">
            <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-white">ConsultSummary</h1>
              <span className="text-xs text-white/70 -mt-1">Asistente Médico IA</span>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setApiDialogOpen(true)}
                className="text-white/90 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                {hasApiKey ? "API Configurada" : "Configurar API"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="text-white border-white/30 bg-white/5 hover:bg-white/15 backdrop-blur-md"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="text-white border-white/30 bg-white/5 hover:bg-white/15 backdrop-blur-md"
            >
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
