
import { supabase } from "@/integrations/supabase/client";
import { ApiResponse } from "@/types";

export type LogLevel = 'info' | 'warning' | 'error' | 'critical';

export interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  details?: Record<string, any>;
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
}

// Función de conveniencia para registrar errores de manera rápida
export const logError = (source: string, message: string, details?: Record<string, any>) => {
  LoggingService.error(source, message, details)
    .then(() => console.log(`Error registrado: ${message}`))
    .catch(err => console.error('Error al registrar error:', err));
};

// Modificamos el webhook para registrar logs cuando hay errores de procesamiento
export const enhanceWebhookWithLogging = () => {
  // Backup de la función original de sendToWebhook
  // Esta modificación se puede aplicar cuando sea necesario
  const originalSendToWebhook = require('./webhooks').sendToWebhook;
  
  const enhancedSendToWebhook = async (payload: any) => {
    try {
      // Registrar intento de envío
      await LoggingService.info('webhook', 'Enviando datos al webhook', { 
        audio_url_provided: !!payload.audio_url 
      });
      
      const result = await originalSendToWebhook(payload);
      
      if (!result.success) {
        // Registrar error
        await LoggingService.error('webhook', 'Error en webhook', { 
          error: result.error,
          payload_summary: {
            has_audio: !!payload.audio_url,
            audio_length: payload.audio_url?.length || 0
          }
        });
      }
      
      return result;
    } catch (error) {
      // Registrar error inesperado
      await LoggingService.critical('webhook', 'Error inesperado en webhook', { 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      });
      throw error;
    }
  };
  
  // Esta función puede ser usada para reemplazar la original cuando sea necesario
  return enhancedSendToWebhook;
};
