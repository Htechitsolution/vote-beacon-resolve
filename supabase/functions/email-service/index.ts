
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== EMAIL SERVICE STARTED ===");
    
    // Get email credentials from environment
    const email_user = Deno.env.get("EMAIL_USER");
    const email_password = Deno.env.get("EMAIL_PASSWORD");
    
    console.log("Email user configured:", email_user ? "✅ YES" : "❌ NO");
    console.log("Email password configured:", email_password ? "✅ YES" : "❌ NO");
    
    if (!email_user || !email_password) {
      console.error("❌ Missing email credentials");
      console.error("EMAIL_USER:", email_user ? "SET" : "NOT SET");
      console.error("EMAIL_PASSWORD:", email_password ? "SET" : "NOT SET");
      
      return new Response(JSON.stringify({
        success: false,
        message: "Email service credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD in Supabase secrets.",
        details: {
          email_user_set: !!email_user,
          email_password_set: !!email_password
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const payload: EmailPayload = await req.json();
    const { to, subject, body, type, replyTo, name } = payload;

    console.log(`📧 Processing ${type} email`);
    console.log("To:", to);
    console.log("From:", `The-eVoting <${email_user}>`);
    console.log("Subject:", subject);

    // Setup SMTP client with detailed logging
    console.log("🔧 Setting up SMTP client...");
    const client = new SmtpClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 587,
        tls: true,
        auth: {
          username: email_user,
          password: email_password,
        },
      },
      debug: true,
    });

    console.log("📤 Sending email...");
    
    // Send the email
    const emailResult = await client.send({
      from: `The-eVoting <${email_user}>`,
      to: to,
      subject: subject,
      content: "text/html",
      html: body,
      ...(replyTo ? { replyTo } : {}),
    });

    console.log("✅ Email sent successfully:", emailResult);
    
    await client.close();
    console.log("🔌 SMTP connection closed");

    return new Response(JSON.stringify({
      success: true,
      message: "Email sent successfully",
      details: {
        from: `The-eVoting <${email_user}>`,
        to: to,
        subject: subject,
        type: type
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Error sending email:", error);
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      message: `Failed to send email: ${error.message}`,
      error: {
        type: error.constructor.name,
        message: error.message,
        details: error.toString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
