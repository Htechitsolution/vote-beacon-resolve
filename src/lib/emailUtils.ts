
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

// Function to send voter OTP email
export const sendVoterOTP = async (email: string, name: string, otp: string, projectName: string, votingLink: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("Sending voter OTP email to:", email);
    
    const { data, error } = await supabase.functions.invoke('send-voter-otp', {
      body: {
        email,
        name,
        otp,
        projectName,
        votingLink
      }
    });
    
    if (error) {
      console.error("Voter OTP email sending error:", error);
      return { success: false, message: error.message };
    }
    
    console.log("Voter OTP email sent successfully:", data);
    return { success: true, message: "Voter login link sent successfully" };
  } catch (error: any) {
    console.error("Exception in sending voter OTP:", error);
    return { success: false, message: error.message || "Failed to send voter login link" };
  }
};
