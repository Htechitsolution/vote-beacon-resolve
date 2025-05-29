
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.7";

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

    // Create nodemailer transporter with Gmail configuration
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: email_user,
        pass: email_password,
      },
    });

    // Verify the connection configuration
    await transporter.verify();
    console.log("Gmail SMTP connection verified successfully");

    // Send the email
    const info = await transporter.sendMail({
      from: `"The-eVoting" <${email_user}>`,
      to: to,
      subject: subject,
      html: body,
      replyTo: replyTo || email_user,
    });

    console.log(`Successfully sent ${type} email to ${to}. Message ID: ${info.messageId}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

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
