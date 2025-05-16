
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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
    const email_user = Deno.env.get("EMAIL_USER");
    const email_password = Deno.env.get("EMAIL_PASSWORD");

    if (!email_user || !email_password) {
      console.error("Missing email credentials", { user: email_user ? "set" : "missing", password: email_password ? "set" : "missing" });
      throw new Error("Email service credentials not configured");
    }

    const payload: EmailPayload = await req.json();
    const { to, subject, body, type, replyTo, name } = payload;

    console.log(`Processing ${type} email to ${to}`);

    // Setup SMTP client with more detailed configuration
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 587,
        tls: false,
        auth: {
          username: email_user,
          password: email_password,
        },
      },
      debug: true, // Enable debug logging
    });

    // Send the email
    const emailResult = await client.send({
      from: `The-eVoting <${email_user}>`,
      to: to,
      subject: subject,
      content: "text/html",
      html: body,
      ...(replyTo ? { replyTo } : {}),
    });

    await client.close();

    console.log(`Successfully sent ${type} email to ${to}`, emailResult);

    return new Response(JSON.stringify({
      success: true,
      message: "Email sent successfully"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error.message || "Failed to send email",
      error: JSON.stringify(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
