
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Email types
export type EmailType = 'reminder' | 'results' | 'password_reset' | 'voter_otp' | 'contact' | 'registration' | 'purchase_confirmation' | 'voting_started' | 'voting_ended';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  type: EmailType;
  replyTo?: string;
  name?: string;
}

/**
 * Centralized email sending function
 * Use this function for all email sending operations
 */
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

/**
 * Creates HTML email template for different email types
 */
export const createEmailTemplate = (type: EmailType, params: Record<string, any>): string => {
  const baseStyle = `
    font-family: Arial, sans-serif; 
    max-width: 600px; 
    margin: 0 auto;
    line-height: 1.6;
  `;
  
  const buttonStyle = `
    display: inline-block; 
    background-color: #4361ee; 
    color: white; 
    padding: 10px 20px; 
    text-decoration: none; 
    border-radius: 5px;
    font-weight: 500;
    margin: 15px 0;
  `;
  
  switch(type) {
    case 'password_reset':
      return `
        <div style="${baseStyle}">
          <h2>Password Reset</h2>
          <p>Hello ${params.name || ''},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <p><a href="${params.resetLink}" style="${buttonStyle}">Reset Password</a></p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>Thank you,<br>The-eVoting Team</p>
        </div>
      `;
    
    case 'voting_started':
      return `
        <div style="${baseStyle}">
          <h2>Voting Has Started: ${params.meetingTitle}</h2>
          <p>Hello ${params.name || ''},</p>
          <p>Voting has started for the meeting: <strong>${params.meetingTitle}</strong></p>
          <p>You can now submit your votes until: <strong>${params.endDate}</strong></p>
          <p><a href="${params.votingLink}" style="${buttonStyle}">Go to Voting Page</a></p>
          <p>Thank you for your participation,<br>The-eVoting Team</p>
        </div>
      `;
      
    case 'voting_ended':
      return `
        <div style="${baseStyle}">
          <h2>Voting Has Ended: ${params.meetingTitle}</h2>
          <p>Hello ${params.name || ''},</p>
          <p>Voting has ended for the meeting: <strong>${params.meetingTitle}</strong></p>
          <p>You can view the results at the link below:</p>
          <p><a href="${params.resultsLink}" style="${buttonStyle}">View Results</a></p>
          <p>Thank you for your participation,<br>The-eVoting Team</p>
        </div>
      `;
      
    // Add more template types as needed
      
    default:
      return params.body || '<p>No content provided</p>';
  }
};
