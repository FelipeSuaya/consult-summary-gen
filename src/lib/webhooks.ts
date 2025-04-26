
type WebhookPayload = {
  audio_url: string;
  transcripcion: string;
  resumen: string;
};

export const sendToWebhook = async (payload: WebhookPayload) => {
  try {
    const response = await fetch('http://localhost:5678/webhook/lovable-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Error al enviar datos al webhook');
    }

    console.log('Datos enviados al webhook exitosamente');
    return true;
  } catch (error) {
    console.error('Error enviando datos al webhook:', error);
    throw error;
  }
};
