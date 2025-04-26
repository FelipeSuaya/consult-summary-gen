
type WebhookPayload = {
  audio_url: string;
  transcripcion: string;
  resumen: string;
};

export const sendToWebhook = async (payload: WebhookPayload) => {
  try {
    console.log("Enviando datos al webhook:", payload);
    
    // Asegurarse de que el audio_url no sea null
    if (!payload.audio_url) {
      payload.audio_url = ""; // Proporcionar un valor por defecto
    }
    
    const response = await fetch('https://n8n-1-o3cv.onrender.com/workflow/Exwq9Ann1CxRZ8T3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // No usar 'no-cors' ya que esto impide recibir respuestas adecuadas
    });

    console.log("Respuesta del webhook:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error del servidor webhook:", errorText);
      throw new Error(`Error al enviar datos al webhook: ${response.status} ${response.statusText}`);
    }

    console.log('Datos enviados al webhook exitosamente');
    return true;
  } catch (error) {
    console.error('Error enviando datos al webhook:', error);
    // No propagar el error, solo registrarlo
    return false;
  }
};
