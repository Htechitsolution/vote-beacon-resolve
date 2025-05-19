
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Email types
export type EmailType = 'reminder' | 'results' | 'password_reset';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  type: EmailType;
  replyTo?: string;
  name?: string;
}

export const sendEmail = async (payload: EmailPayload): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("Sending email to:", payload.to);
    
    const { data, error } = await supabase.functions.invoke('email-service', {
      body: payload
    });
    
    if (error) {
      console.error("Email sending error:", error);
      return { success: false, message: error.message };
    }
    
    console.log("Email sent successfully:", data);
    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("Exception in sending email:", error);
    return { success: false, message: error.message || "Failed to send email" };
  }
};
