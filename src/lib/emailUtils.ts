
import { supabase } from "@/integrations/supabase/client";

export type EmailTemplateType = 
  | 'voterOtp' 
  | 'votingLink' 
  | 'votingResults' 
  | 'passwordReset';

interface EmailTemplateParams {
  recipientName?: string;
  projectName?: string;
  votingLink?: string;
  otp?: string;
  resultUrl?: string;
  resultTitle?: string;
  resetLink?: string;
}

/**
 * Utility function to send emails using the email-service edge function
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  templateType: EmailTemplateType,
  params: EmailTemplateParams
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    // Get HTML content for the email
    const html = getEmailTemplate(templateType, params);

    // Call our email service edge function
    const { data, error } = await supabase.functions.invoke('email-service', {
      body: {
        to,
        subject,
        html
      }
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, message: "Failed to send email", error: error.message };
    }

    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("Error in sendEmail function:", error);
    return { success: false, message: `Error sending email: ${error.message}`, error: error.message };
  }
}

/**
 * Generate HTML content for various email templates
 */
function getEmailTemplate(type: EmailTemplateType, params: EmailTemplateParams): string {
  const { recipientName = "Voter", projectName = "Meeting", votingLink, otp, resultUrl, resultTitle, resetLink } = params;
  
  switch (type) {
    case 'voterOtp':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Your One-Time Password</h2>
          <p>Hello ${recipientName},</p>
          <p>You have requested to login to the <strong>${projectName}</strong> meeting. Use the following One-Time Password (OTP) to complete your login:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 4px;">
            ${otp}
          </div>
          <p><strong>This OTP is valid for 15 minutes.</strong></p>
          <p>If you didn't request this login, please ignore this email or contact the meeting administrator.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #777; text-align: center;">This is an automated message, please do not reply to this email.</p>
        </div>
      `;
    
    case 'votingLink':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Your Voting Information</h2>
          <p>Hello ${recipientName},</p>
          <p>You have been invited to participate in voting for the <strong>${projectName}</strong> meeting.</p>
          <p>Please click the link below and use the One-Time Password (OTP) to access your voting dashboard:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${votingLink}" style="background-color: #4361ee; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Go to Voting
            </a>
          </div>
          <p>Your One-Time Password (OTP):</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 4px;">
            ${otp}
          </div>
          <p><strong>This OTP is valid for 15 minutes.</strong></p>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${votingLink}</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #777; text-align: center;">This is an automated message, please do not reply to this email.</p>
        </div>
      `;
    
    case 'votingResults':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Voting Results</h2>
          <p>Hello ${recipientName},</p>
          <p>The results for the <strong>${resultTitle || "voting"}</strong> in <strong>${projectName}</strong> meeting are now available.</p>
          <p>Please click the button below to view the results:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resultUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Results
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resultUrl}</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #777; text-align: center;">This is an automated message, please do not reply to this email.</p>
        </div>
      `;
    
    case 'passwordReset':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Password Reset</h2>
          <p>Hello ${recipientName},</p>
          <p>We received a request to reset your password for the <strong>${projectName}</strong> application.</p>
          <p>Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetLink}" style="background-color: #4361ee; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetLink}</p>
          <p>If you did not request a password reset, please ignore this email or contact support.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #777; text-align: center;">This is an automated message, please do not reply to this email.</p>
        </div>
      `;
    
    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">E-Voting Notification</h2>
          <p>Hello ${recipientName},</p>
          <p>This is a notification from the E-Voting system.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #777; text-align: center;">This is an automated message, please do not reply to this email.</p>
        </div>
      `;
  }
}
