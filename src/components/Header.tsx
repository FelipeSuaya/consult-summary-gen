
import React from "react";
import { Button } from "@/components/ui/button";
import { MicOff, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <MicOff className="h-6 w-6 text-medical-600" />
            <h1 className="text-xl font-medium tracking-tight text-medical-900">ConsultSummary</h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">
                <User className="h-4 w-4 mr-2" />
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
