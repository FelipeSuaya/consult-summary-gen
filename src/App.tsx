
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoggingService } from "./lib/logging";

// Componente para registrar cambios de ruta
const RouteLogger = () => {
  const location = useLocation();
  
  useEffect(() => {
    LoggingService.info('navigation', `Navegación a ruta: ${location.pathname}`)
      .catch(err => console.error('Error al registrar navegación:', err));
  }, [location.pathname]);
  
  return null;
};

// Componente protegido que requiere autenticación
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        LoggingService.warning('auth', 'Intento de acceso a ruta protegida sin autenticación')
          .catch(err => console.error('Error al registrar intento de acceso:', err));
      }
    }
  }, [user, loading]);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children}</>;
};

function App() {
  // Create a client
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteLogger />
            <Routes>
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route path="/auth" element={<Auth />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
