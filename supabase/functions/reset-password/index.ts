
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ResetPasswordPayload {
  email: string;
  resetLink: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const email_user = Deno.env.get("EMAIL_USER");
    const email_password = Deno.env.get("EMAIL_PASSWORD");

    if (!email_user || !email_password) {
      throw new Error("Email service credentials not configured");
    }

    const payload: ResetPasswordPayload = await req.json();
    const { email, resetLink } = payload;

    // Create nodemailer transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: email_user,
        pass: email_password,
      },
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your The-eVoting account. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This is an automated message from The-eVoting. Please do not reply to this email.
        </p>
      </div>
    `;

    // Send the email using nodemailer
    const info = await transporter.sendMail({
      from: `"The-eVoting" <${email_user}>`,
      to: email,
      subject: "Password Reset Request",
      html: htmlBody,
    });

    console.log("Password reset email sent successfully. Message ID:", info.messageId);

    return new Response(JSON.stringify({
      success: true,
      message: "Password reset email sent successfully",
      messageId: info.messageId
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error sending password reset email:", error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || "Failed to send password reset email"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
