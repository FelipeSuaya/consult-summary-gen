
import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut, User, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Activity className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            ConsultSummary
          </span>
        </Link>
        
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                    {user.email?.charAt(0).toUpperCase() || "D"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout()}
                className="h-8 px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild className="h-8 gap-1.5 bg-primary hover:bg-primary/90">
              <Link to="/auth">
                <User className="h-3.5 w-3.5" />
                Ingresar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
