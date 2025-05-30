
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  type: string;
  replyTo?: string;
  name?: string;
}

// Email template creation function (duplicated here for edge function use)
const createEmailTemplate = (type: string, params: Record<string, any>): string => {
  const baseStyle = `
    font-family: Arial, sans-serif; 
    max-width: 600px; 
    margin: 0 auto;
    line-height: 1.6;
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
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
          <h2 style="color: #4f46e5;">Password Reset Request</h2>
          <p>Hello ${params.name || ''},</p>
          <p>We received a request to reset your password for your The-eVoting account. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${params.resetLink}" style="${buttonStyle}">Reset Password</a>
          </div>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            This is an automated message from The-eVoting. Please do not reply to this email.
          </p>
        </div>
      `;
    
    case 'voter_otp':
      return `
        <div style="${baseStyle}">
          <h2>Your Login Details for ${params.projectName}</h2>
          <p>Hello ${params.name},</p>
          <p>You have been invited to vote in: <strong>${params.projectName}</strong></p>
          <p>Your one-time password is: <strong style="font-size: 20px;">${params.otp}</strong></p>
          <p>Please click the link below to access the voting portal:</p>
          <p><a href="${params.votingLink}" style="${buttonStyle}">Go to Voting Portal</a></p>
          <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
          <p>${params.votingLink}</p>
          <p>This login code will expire in 30 minutes.</p>
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
      
    default:
      return params.body || '<p>No content provided</p>';
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const email_user = Deno.env.get("EMAIL_USER");
    const email_password = Deno.env.get("EMAIL_PASSWORD");
    
    if (!email_user || !email_password) {
      console.error("Missing email credentials", { user: email_user ? "set" : "missing", password: email_password ? "set" : "missing" });
      throw new Error("Email service credentials not configured");
    }

    const payload: EmailPayload = await req.json();
    let { to, subject, body, type, replyTo, name } = payload;

    console.log(`Processing ${type} email to ${to}`);

    // If this is a templated email type, generate the body using the template
    if (['password_reset', 'voter_otp', 'voting_started', 'voting_ended'].includes(type)) {
      // For password_reset, we need to extract resetLink from the existing body or params
      if (type === 'password_reset') {
        // Extract resetLink from payload if it exists
        const resetLink = (payload as any).resetLink || `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/reset-password`;
        body = createEmailTemplate(type, { resetLink, name });
      } else if (type === 'voter_otp') {
        // Extract OTP parameters from payload
        const { otp, projectName, votingLink } = payload as any;
        body = createEmailTemplate(type, { name, otp, projectName, votingLink });
      } else {
        body = createEmailTemplate(type, payload as any);
      }
    }

    // Create SMTP client with CORRECTED Gmail configuration
    const client = new SmtpClient();

    try {
      console.log("Connecting to Gmail SMTP...");
      
      // Connect to the SMTP server with PROPER configuration structure
      await client.connect({
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: email_user,
          password: email_password,
        },
      });
      
      console.log("Connected to Gmail SMTP successfully");
      
      // Send the email
      await client.send({
        from: `The-eVoting <${email_user}>`,
        to: to,
        subject: subject,
        content: body,
        html: body,
        ...(replyTo && { replyTo }),
      });

      console.log(`Successfully sent ${type} email to ${to}`);

      return new Response(JSON.stringify({
        success: true,
        message: "Email sent successfully"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } finally {
      try {
        await client.close();
        console.log("SMTP connection closed");
      } catch (closeError) {
        console.log("Error closing SMTP client:", closeError);
      }
    }

  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error.message || "Failed to send email",
      error: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
