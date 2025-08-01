
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope, Shield, Sparkles, UserPlus, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Auth = () => {
  const { login, register, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await login(email, password);
    
    if (error) {
      toast({
        title: "Error de inicio de sesión",
        description: error,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
    
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (password.length < 6) {
      toast({
        title: "Error de registro",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    const { error } = await register(email, password);
    
    if (error) {
      toast({
        title: "Error de registro",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registro exitoso",
        description: "Por favor verifica tu correo electrónico para confirmar tu cuenta",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-medical-50/30">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-medical-500/20 rounded-xl blur-sm" />
              <div className="relative bg-gradient-to-br from-medical-500 to-medical-600 p-2.5 rounded-xl shadow-lg">
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
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 py-16">
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Features */}
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-medical-50 text-medical-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="h-4 w-4" />
                  Tecnología Médica Avanzada
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-4 bg-gradient-to-r from-medical-700 via-medical-600 to-medical-800 bg-clip-text text-transparent">
                  Bienvenido a ConsultSummary
                </h1>
                <p className="text-lg text-muted-foreground">
                  La plataforma de documentación médica más avanzada con inteligencia artificial para profesionales de la salud.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-medical-100 rounded-lg mt-1">
                    <Stethoscope className="h-4 w-4 text-medical-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Transcripción Automática</h3>
                    <p className="text-sm text-muted-foreground">Convierte automáticamente tus consultas de audio a texto estructurado.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-medical-100 rounded-lg mt-1">
                    <Shield className="h-4 w-4 text-medical-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Privacidad Total</h3>
                    <p className="text-sm text-muted-foreground">Todos los datos están encriptados y cumplen con normativas médicas.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-medical-100 rounded-lg mt-1">
                    <Sparkles className="h-4 w-4 text-medical-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Resúmenes Inteligentes</h3>
                    <p className="text-sm text-muted-foreground">Genera resúmenes médicos estructurados automáticamente con IA.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Auth Form */}
            <div>
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl">Acceso Profesional</CardTitle>
                  <CardDescription className="text-base">
                    Inicia sesión o regístrate para gestionar tus consultas médicas
                  </CardDescription>
                </CardHeader>
                
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mx-6 mb-6">
                    <TabsTrigger value="login" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Iniciar Sesión
                    </TabsTrigger>
                    <TabsTrigger value="register" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Registrarse
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">
                            Correo Electrónico
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="doctor@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium">
                            Contraseña
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11"
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button 
                          type="submit" 
                          className="w-full h-11 bg-medical-600 hover:bg-medical-700" 
                          disabled={loading}
                        >
                          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>
                      </CardFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleRegister}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-email" className="text-sm font-medium">
                            Correo Electrónico
                          </Label>
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="doctor@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password" className="text-sm font-medium">
                            Contraseña
                          </Label>
                          <Input
                            id="register-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11"
                          />
                          <p className="text-xs text-muted-foreground">
                            La contraseña debe tener al menos 6 caracteres
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <Button 
                          type="submit" 
                          className="w-full h-11 bg-medical-600 hover:bg-medical-700" 
                          disabled={loading}
                        >
                          {loading ? "Registrando..." : "Crear Cuenta"}
                        </Button>
                      </CardFooter>
                    </form>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
