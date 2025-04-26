
type WebhookPayload = {
  audio_url: string;
  transcripcion: string;
  resumen: string;
  audio_base64?: string;
};

export const sendToWebhook = async (payload: WebhookPayload) => {
  try {
    console.log("Enviando datos al webhook");
    
    // Asegurarse de que el audio_url no sea null
    if (!payload.audio_url) {
      payload.audio_url = "";
    }
    
    const response = await fetch('https://n8nwebhook.botec.tech/webhook/lovable-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

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
    console.error('Error enviando datos al webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

