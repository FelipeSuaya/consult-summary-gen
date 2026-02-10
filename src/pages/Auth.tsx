
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Shield, Sparkles, Mic } from "lucide-react";
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Activity className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              ConsultSummary
            </span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Value Proposition */}
            <div className="space-y-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
                  Documentación médica
                  <br />
                  <span className="text-primary">inteligente</span>
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  Transcribe, resume y organiza consultas médicas automáticamente con IA.
                </p>
              </div>
              
              <div className="space-y-4">
                {[
                  { icon: Mic, title: "Transcripción automática", desc: "Audio a texto estructurado en tiempo real" },
                  { icon: Sparkles, title: "Resúmenes con IA", desc: "Notas SOAP generadas automáticamente" },
                  { icon: Shield, title: "Datos seguros", desc: "Encriptación y cumplimiento normativo" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-accent-foreground shrink-0 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right side - Auth Form */}
            <div className="animate-slide-up">
              <Card className="shadow-lg border-border/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Acceso Profesional</CardTitle>
                  <CardDescription>
                    Inicia sesión o crea tu cuenta
                  </CardDescription>
                </CardHeader>
                
                <Tabs defaultValue="login" className="w-full">
                  <div className="px-6">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="login">Ingresar</TabsTrigger>
                      <TabsTrigger value="register">Registrarse</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin}>
                      <CardContent className="space-y-4 pt-0">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="doctor@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm">Contraseña</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-10"
                          />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          type="submit" 
                          className="w-full h-10" 
                          disabled={loading}
                        >
                          {loading ? "Ingresando..." : "Iniciar Sesión"}
                        </Button>
                      </CardFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleRegister}>
                      <CardContent className="space-y-4 pt-0">
                        <div className="space-y-2">
                          <Label htmlFor="register-email" className="text-sm">Email</Label>
                          <Input
                            id="register-email"
                            type="email"
                            placeholder="doctor@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password" className="text-sm">Contraseña</Label>
                          <Input
                            id="register-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-10"
                          />
                          <p className="text-xs text-muted-foreground">
                            Mínimo 6 caracteres
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          type="submit" 
                          className="w-full h-10" 
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
