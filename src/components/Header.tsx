
import React from "react";
import { Button } from "@/components/ui/button";
import { MicOff, User, LogOut, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="absolute inset-0 bg-gradient-to-r from-medical-500/5 via-transparent to-emerald-500/5"></div>
      <div className="container relative flex h-20 items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="group flex items-center gap-3 transition-all duration-300 hover:scale-105">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-medical-500 to-medical-600 opacity-80 blur-sm group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-medical-500 to-medical-600 shadow-medical">
                <MicOff className="h-6 w-6 text-white" />
                <Activity className="absolute -top-1 -right-1 h-4 w-4 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-medical-700 via-medical-600 to-medical-500 bg-clip-text text-transparent">
                ConsultSummary
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Sistema Médico Inteligente</p>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-slate-700">Dr. Usuario</span>
                <span className="text-xs text-muted-foreground">Sesión activa</span>
              </div>
              <Button 
                variant="outline" 
                size="default" 
                onClick={handleLogout}
                className="group h-11 border-2 border-red-100 bg-white/80 text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-300 shadow-soft hover:shadow-md backdrop-blur-sm"
              >
                <LogOut className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-medium">Cerrar Sesión</span>
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="default" 
              asChild
              className="group h-11 border-2 border-medical-200 bg-white/80 text-medical-700 hover:bg-medical-50 hover:border-medical-300 hover:text-medical-800 transition-all duration-300 shadow-soft hover:shadow-medical backdrop-blur-sm"
            >
              <Link to="/auth">
                <User className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Iniciar Sesión</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
