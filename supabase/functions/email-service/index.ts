
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[]; // Can be a single email or array of emails
  subject: string;
  html: string;
  from?: string; // Optional custom from address
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as EmailRequest;
    
    // Validate required fields
    if (!payload.to || !payload.subject || !payload.html) {
      throw new Error("Missing required email fields: to, subject, or html");
    }

    // Format recipients as array
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    if (recipients.length === 0) {
      throw new Error("No recipients specified");
    }
    
    console.log(`Sending email to ${recipients.length} recipients with subject: ${payload.subject}`);
    
    // Set up email data for nodemailer
    const emailData = {
      from: payload.from || "E-Voting App <htech.walit@gmail.com>",
      to: recipients,
      subject: payload.subject,
      html: payload.html
    };

    // Get email credentials from environment variables
    const emailUser = Deno.env.get("EMAIL_USER") as string;
    const emailPass = Deno.env.get("EMAIL_PASSWORD") as string;
    
    if (!emailUser || !emailPass) {
      throw new Error("Email credentials not configured");
    }

    // Send email using nodemailer and Gmail SMTP
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
    
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: emailUser,
          password: emailPass,
        },
      }
    });

    const sendResult = await client.send(emailData);
    await client.close();
    
    console.log("Email sent successfully:", sendResult.messageId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully", 
        messageId: sendResult.messageId 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
