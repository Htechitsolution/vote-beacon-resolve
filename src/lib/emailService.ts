
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Email types
export type EmailType = 
  | 'voter_otp' 
  | 'password_reset' 
  | 'contact_form' 
  | 'credit_purchase' 
  | 'voting_results' 
  | 'voting_started' 
  | 'voting_ended';

// Base email payload interface
export interface EmailBasePayload {
  to: string;
  subject: string;
  type: EmailType;
}

// Specific email payload types
export interface OtpEmailPayload extends EmailBasePayload {
  name: string;
  otp: string;
  projectName: string;
  votingLink: string;
}

export interface ResetPasswordPayload extends EmailBasePayload {
  resetLink: string;
}

export interface ContactFormPayload extends EmailBasePayload {
  name: string;
  message: string;
  replyTo: string;
}

export interface ResultsEmailPayload extends EmailBasePayload {
  agendaTitle: string;
  projectName: string;
  resultsLink: string;
}

export interface VotingStatusEmailPayload extends EmailBasePayload {
  agendaTitle: string;
  projectName: string;
  votingLink: string;
  endDate?: string;
}

// Union type for all email payloads
export type EmailPayload = 
  | OtpEmailPayload
  | ResetPasswordPayload
  | ContactFormPayload
  | ResultsEmailPayload
  | VotingStatusEmailPayload;

/**
 * Unified email sending function for all types of emails
 */
export const sendEmail = async (payload: EmailPayload): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Sending ${payload.type} email to:`, payload.to);
    
    const functionName = getFunctionName(payload.type);
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    if (error) {
      console.error(`Error sending ${payload.type} email:`, error);
      return { success: false, message: error.message };
    }
    
    console.log(`${payload.type} email sent successfully:`, data);
    return { success: true, message: `Email sent successfully` };
  } catch (error: any) {
    console.error(`Exception in sending ${payload.type} email:`, error);
    return { success: false, message: error.message || "Failed to send email" };
  }
};

/**
 * Helper function to map email types to Supabase edge functions
 */
const getFunctionName = (emailType: EmailType): string => {
  switch (emailType) {
    case 'voter_otp':
      return 'send-voter-otp';
    case 'password_reset':
      return 'reset-password';
    case 'contact_form':
      return 'send-contact-email';
    // These could be consolidated to a single function with different templates
    case 'credit_purchase':
    case 'voting_results':
    case 'voting_started':
    case 'voting_ended':
      return 'email-service';
    default:
      return 'email-service';
  }
};

/**
 * Function specifically for sending voter OTP emails
 */
export const sendVoterOTP = async (
  email: string, 
  name: string, 
  otp: string, 
  projectName: string, 
  votingLink: string
): Promise<{ success: boolean; message: string }> => {
  return sendEmail({
    to: email,
    subject: `Your Login Code for ${projectName}`,
    type: 'voter_otp',
    name,
    otp,
    projectName,
    votingLink
  });
};
