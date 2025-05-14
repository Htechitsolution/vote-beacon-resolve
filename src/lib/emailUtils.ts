
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Email types
export type EmailType = 'voter_otp' | 'reminder' | 'results' | 'password_reset' | 'voting_link';

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

export const sendVoterOTP = async (voterEmail: string, voterName: string, otp: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-voter-otp', {
      body: { email: voterEmail, name: voterName, otp }
    });
    
    if (error) {
      console.error("Error sending voter OTP:", error);
      toast.error("Failed to send OTP to voter");
      return { success: false, message: error.message };
    }
    
    console.log("OTP sent successfully:", data);
    toast.success("OTP sent to voter successfully");
    return { success: true, message: "OTP sent successfully" };
  } catch (error: any) {
    console.error("Exception in sending OTP:", error);
    toast.error(error.message || "Failed to send OTP");
    return { success: false, message: error.message || "Failed to send OTP" };
  }
};
