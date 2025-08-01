
import { supabase } from "@/integrations/supabase/client";

export const ensureConsultationAudiosBucket = async (): Promise<void> => {
  try {
    // Call the edge function to ensure bucket exists
    const { data, error } = await supabase.functions.invoke('ensure-audio-bucket');
    
    if (error) {
      console.error("Error ensuring audio bucket:", error);
    } else {
      console.log("Audio bucket check result:", data);
    }
  } catch (error) {
    console.error("Error calling ensure-audio-bucket function:", error);
  }
};
