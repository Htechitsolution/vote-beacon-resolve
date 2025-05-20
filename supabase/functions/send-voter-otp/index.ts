import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VoterEmailRequest {
  email: string;
  name: string;
  otp?: string; // Keep for backward compatibility
  projectName: string;
  votingLink: string;
  emailSubject?: string;
  emailBody?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: VoterEmailRequest = await req.json();
    const { email, name, projectName, votingLink, emailSubject, emailBody } = requestData;

    // Basic validation
    if (!email) {
      return new Response(
        JSON.stringify({ 
          error: "Email is required" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    try {
      // Get email credentials from environment variables
      const email_user = Deno.env.get("EMAIL_USER") || "noreply@htechsolutions.in";
      const email_password = Deno.env.get("EMAIL_PASSWORD") || "TqB(ttf3";
  
      if (!email_user || !email_password) {
        throw new Error("Email credentials are not configured");
      }
  
      // Set up SMTP client
      const client = new SMTPClient({
        connection: {
          hostname: "us2.smtp.mailhostbox.com",
          port: 25,
          tls: false,
          auth: {
            username: email_user,
            password: email_password,
          },
        },
      });
  
      // Create HTML email content
      let htmlBody;
      
      // If custom email body is provided, use it
      if (emailBody) {
        htmlBody = emailBody;
      } 
      // Otherwise, generate a default template (for backward compatibility)
      else if (requestData.otp) {
        htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #4f46e5;">Your Login Code for ${projectName}</h2>
            <p>Hello ${name || 'Voter'},</p>
            <p>Please use the following code to log in to the ${projectName} voting platform:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 4px; margin: 20px 0;">
              ${requestData.otp}
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `;
      } else {
        throw new Error("Either otp or emailBody must be provided");
      }
  
      // Send the email
      await client.send({
        from: `The-eVoting <${email_user}>`,
        to: email,
        subject: emailSubject || `Your Login Code for ${projectName}`,
        content: "text/html",
        html: htmlBody,
      });
  
      await client.close();
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Email sent successfully" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      
      // Return success: false but still status 200 so front-end can handle properly
      return new Response(
        JSON.stringify({ 
          success: false,
          message: `Email sending failed: ${emailError.message}`,
          error: emailError.message
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to process request" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
