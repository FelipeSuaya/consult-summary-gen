
-- Crear tabla de perfiles de usuario
CREATE TABLE public.user_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Habilitar RLS para user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Crear tabla de pacientes
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dni TEXT,
  phone TEXT,
  age TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Políticas para patients
CREATE POLICY "Users can view their own patients" 
  ON public.patients 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patients" 
  ON public.patients 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients" 
  ON public.patients 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients" 
  ON public.patients 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Crear tabla de consultas
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  audio_url TEXT,
  transcription TEXT,
  summary TEXT,
  patient_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para consultations
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Políticas para consultations
CREATE POLICY "Users can view their own consultations" 
  ON public.consultations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consultations" 
  ON public.consultations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consultations" 
  ON public.consultations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consultations" 
  ON public.consultations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Crear tabla de prompts para el sistema de IA
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para prompts (acceso público de lectura)
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Políticas para prompts
CREATE POLICY "Anyone can read active prompts" 
  ON public.prompts 
  FOR SELECT 
  USING (active = true);

-- Crear tabla de logs de la aplicación
CREATE TABLE public.app_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  level TEXT NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para app_logs
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para app_logs
CREATE POLICY "Users can view their own logs" 
  ON public.app_logs 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert logs" 
  ON public.app_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Crear función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Crear trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Función para logging
CREATE OR REPLACE FUNCTION public.log(
  p_user_id UUID,
  p_level TEXT,
  p_source TEXT,
  p_message TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.app_logs (user_id, level, source, message, details)
  VALUES (p_user_id, p_level, p_source, p_message, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Insertar prompt por defecto para el sistema de transcripción
INSERT INTO public.prompts (name, content, active) VALUES (
  'transcription_summary',
  'Eres un asistente médico especializado en documentación clínica. A partir de la siguiente transcripción de una consulta médica, extrae y resume la información clínica relevante utilizando terminología médica técnica y profesional, siguiendo una estructura estandarizada.

⚠️ IMPORTANTE: Si en la transcripción se mencionan datos personales del paciente, deben ser incluidos en su totalidad y sin omisiones:

Nombre completo
DNI
Teléfono
Correo electrónico
Edad
Domicilio
Género
Nivel educativo (escolaridad)
Ocupación
Obra social
Procedencia

🧾 ESTRUCTURA DEL RESUMEN (usa estos títulos en este orden exacto):

DATOS PERSONALES: Todos los datos identificatorios mencionados.

MOTIVO DE CONSULTA: Razón principal de la consulta expresada en términos técnicos y precisos.

ANTECEDENTES PERSONALES: Enfermedades crónicas del adulto, internaciones previas, cirugías, alergias, antecedentes traumáticos, medicación habitual, y esquema de vacunación si se menciona.

ANTECEDENTES FAMILIARES: Enfermedades relevantes en familiares de primer o segundo grado (ej. hipertensión, diabetes, cáncer, enfermedades hereditarias).

HÁBITOS: Consumo de tabaco (indicar en paq/año), alcohol (indicar en g/día), otras sustancias si se mencionan.

EXÁMENES COMPLEMENTARIOS PREVIOS:

Laboratorio: Presentar valores relevantes en una tabla clara con las siguientes columnas:
| Parámetro | Resultado | Valor de referencia |

Otros estudios: Incluir resultados de imágenes (radiografías, ecografías, TAC, RMN, etc.) o procedimientos (endoscopías, EKG, etc.) si se mencionan.

DIAGNÓSTICO PRESUNTIVO: Hipótesis diagnóstica basada en la anamnesis y examen físico, con términos médicos adecuados.

INDICACIONES: Detalle del plan terapéutico (medicación, dosis, frecuencia), medidas no farmacológicas y otras recomendaciones.

EXÁMENES SOLICITADOS: Estudios complementarios solicitados durante la consulta.

✅ Sé conciso pero completo. Evita redundancias, pero no omitas datos clínicamente significativos. Siempre que se reporten valores de laboratorio, preséntalos en formato de tabla. Usa nomenclatura médica estandarizada en todo el resumen.',
  true
);
