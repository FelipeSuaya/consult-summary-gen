import React from "react";
import { Button } from "@/components/ui/button";
import { Activity, User, LogOut, Stethoscope, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
const Header = () => {
  const {
    user,
    logout
  } = useAuth();
  const handleLogout = async () => {
    await logout();
  };
  return <header className="sticky top-0 z-50 border-b border-white/30 bg-white/95 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/90">
      <div className="absolute inset-0 bg-gradient-to-r from-medical-500/3 via-transparent to-emerald-500/3"></div>
      <div className="container relative flex h-24 items-center justify-between py-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="group flex items-center gap-4 transition-all duration-500 hover:scale-105">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-medical-500 to-medical-600 opacity-80 blur-lg group-hover:opacity-100 transition-all duration-500"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-medical-500 via-medical-600 to-medical-700 shadow-2xl">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-white/5"></div>
                <Stethoscope className="h-8 w-8 text-white relative z-10" />
                <Heart className="absolute -top-1 -right-1 h-5 w-5 text-emerald-300 animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-medical-700 via-medical-600 to-emerald-600 bg-clip-text text-transparent">
                ConsultSummary
              </h1>
              <p className="text-sm text-muted-foreground font-medium tracking-wide">Sistema Médico Inteligente</p>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60">
                <span className="text-sm font-semibold text-slate-700">Dr. Usuario</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-950">Sesión activa</span>
                </div>
              </div>
              <Button variant="outline" size="default" onClick={handleLogout} className="group h-12 px-6 border-2 border-red-100 bg-white/90 text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm rounded-2xl font-semibold">
                <LogOut className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                <span>Cerrar Sesión</span>
              </Button>
            </div> : <Button variant="outline" size="default" asChild className="group h-12 px-6 border-2 border-medical-200 bg-white/90 text-medical-700 hover:bg-medical-50 hover:border-medical-300 hover:text-medical-800 transition-all duration-300 shadow-lg hover:shadow-medical backdrop-blur-sm rounded-2xl font-semibold">
              <Link to="/auth">
                <User className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span>Iniciar Sesión</span>
              </Link>
            </Button>}
        </div>
      </div>
    </header>;
};
export default Header;