
type WebhookPayload = {
  audio_url: string;
  transcripcion: string;
  resumen: string;
  assembly_upload_url: string; // Haciendo este campo obligatorio
  audio_base64?: string; // Manteniendo este campo como opcional por compatibilidad
};

export const sendToWebhook = async (payload: WebhookPayload) => {
  try {
    console.log("Enviando datos al webhook n8n con AssemblyAI URL");
    
    // Asegurarse de que el audio_url no sea null
    if (!payload.audio_url) {
      payload.audio_url = "";
    }
    
    // Asegurarse de que assembly_upload_url esté presente
    if (!payload.assembly_upload_url) {
      throw new Error("URL de AssemblyAI no proporcionada");
    }
    
    // Configurar un controlador AbortController con un tiempo de espera más largo (2 minutos)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos = 2 minutos
    
    // Usar directamente la URL de webhook con la señal de control
    const response = await fetch('https://n8nwebhook.botec.tech/webhook/lovable-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    // Eliminar el temporizador ya que recibimos una respuesta
    clearTimeout(timeoutId);

    console.log("Respuesta del webhook:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error del servidor webhook:", errorText);
      throw new Error(`Error al enviar datos al webhook: ${response.status} ${response.statusText}`);
    }

    // Obtener la respuesta procesada del webhook
    const webhookResponse = await response.json();
    console.log('Datos recibidos del webhook:', webhookResponse);
    
    return {
      success: true,
      data: webhookResponse
    };
  } catch (error) {
    // Manejar específicamente los errores de tiempo de espera
    if (error.name === 'AbortError') {
      console.log('La solicitud tardó más de lo esperado, pero puede que se esté procesando en N8N');
      return {
        success: true,
        pending: true,
        message: 'La solicitud se envió a N8N pero está tomando más tiempo del esperado. El procesamiento continúa en segundo plano.'
      };
    }
    
    console.error('Error enviando datos al webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};
