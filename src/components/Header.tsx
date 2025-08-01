
import React from "react";
import { Button } from "@/components/ui/button";
import { MicOff, User, LogOut, Stethoscope } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-medical-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
              <div className="relative bg-gradient-to-br from-medical-500 to-medical-600 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-medical-600 to-medical-800 bg-clip-text text-transparent">
                ConsultSummary
              </h1>
              <span className="text-xs text-muted-foreground font-medium">
                Medical Assistant
              </span>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-medium text-foreground">
                  Dr. Usuario
                </span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          ) : (
            <Button variant="default" size="sm" asChild className="gap-2 bg-medical-600 hover:bg-medical-700">
              <Link to="/auth">
                <User className="h-4 w-4" />
                Iniciar Sesión
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
