
import { supabase } from "@/integrations/supabase/client";
import { sendToWebhook } from "./webhooks";

export type LogLevel = 'info' | 'warning' | 'error' | 'critical';

export interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

/**
 * Servicio para registrar logs en Supabase
 */
export class LoggingService {
  /**
   * Registra un evento en el sistema de logs
   * @param entry Información del log
   * @returns Resultado de la operación
   */
  static async log(entry: LogEntry): Promise<ApiResponse<{ id: string }>> {
    try {
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id;

      const { data, error } = await supabase
        .from('app_logs')
        .insert({
          user_id: userId || null,
          level: entry.level,
          source: entry.source,
          message: entry.message,
          details: entry.details || null
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error al registrar log en Supabase:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Error inesperado al registrar log:', error);
      return { error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * Método de conveniencia para registrar logs de nivel info
   */
  static async info(source: string, message: string, details?: Record<string, any>): Promise<ApiResponse<{ id: string }>> {
    return this.log({ level: 'info', source, message, details });
  }

  /**
   * Método de conveniencia para registrar logs de nivel warning
   */
  static async warning(source: string, message: string, details?: Record<string, any>): Promise<ApiResponse<{ id: string }>> {
    return this.log({ level: 'warning', source, message, details });
  }

  /**
   * Método de conveniencia para registrar logs de nivel error
   */
  static async error(source: string, message: string, details?: Record<string, any>): Promise<ApiResponse<{ id: string }>> {
    return this.log({ level: 'error', source, message, details });
  }

  /**
   * Método de conveniencia para registrar logs de nivel critical
   */
  static async critical(source: string, message: string, details?: Record<string, any>): Promise<ApiResponse<{ id: string }>> {
    return this.log({ level: 'critical', source, message, details });
  }

  /**
   * Obtiene los logs del usuario actual
   * @param limit Número máximo de logs a obtener
   * @returns Lista de logs
   */
  static async getUserLogs(limit = 100): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('app_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error al obtener logs:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Error inesperado al obtener logs:', error);
      return { error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * Obtiene logs específicos de grabación de audio
   * @param limit Número máximo de logs a obtener
   * @returns Lista de logs relacionados con grabación de audio
   */
  static async getAudioRecordingLogs(limit = 50): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('app_logs')
        .select('*')
        .eq('source', 'audio-recorder')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error al obtener logs de grabación:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Error inesperado al obtener logs de grabación:', error);
      return { error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  /**
   * Registra un error de AudioRecorder con detalles específicos
   * @param error Error que ocurrió
   * @param details Detalles adicionales
   * @returns Resultado de la operación
   */
  static async logAudioRecorderError(error: Error, details?: Record<string, any>): Promise<ApiResponse<{ id: string }>> {
    // Capturar información del navegador y dispositivo
    const browserInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      deviceMemory: (navigator as any).deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt,
      } : 'unknown'
    };

    return this.error('audio-recorder', `Error de grabación: ${error.message}`, {
      ...details,
      errorStack: error.stack,
      browserInfo,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Registra información sobre la integración con AssemblyAI
   */
  static async logAssemblyAIOperation(operation: string, details?: Record<string, any>): Promise<ApiResponse<{ id: string }>> {
    return this.info('assembly-ai', `Operación AssemblyAI: ${operation}`, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }
}

// Función de conveniencia para registrar errores de manera rápida
export const logError = (source: string, message: string, details?: Record<string, any>) => {
  LoggingService.error(source, message, details)
    .then(() => console.log(`Error registrado: ${message}`))
    .catch(err => console.error('Error al registrar error:', err));
};

// Alias al webhook mejorado con logging
export const enhanceWebhookWithLogging = sendToWebhook;

// Modificamos el main.tsx para activar esta función
export const enhanceLogging = () => {
  console.log("Sistema de logging mejorado activado");
  return true;
};
