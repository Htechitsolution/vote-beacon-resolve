
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OtpRequest {
  email: string;
  name?: string;
  otp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email, name, otp }: OtpRequest = await req.json();

    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    console.log(`Processing OTP email to ${email}`);

    const voterName = name || "Voter";
    const subject = "Your One-Time Password for eVoting";
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #1a73e8;">Your One-Time Password (OTP)</h2>
        <p>Hello ${voterName},</p>
        <p>Please use the following OTP to login to the eVoting portal:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 30 minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `;

    // Call the email-service function to send the email
    const { data: emailData, error: emailError } = await supabase.functions.invoke("email-service", {
      body: {
        to: email,
        subject: subject,
        body: body,
        type: "voter_otp",
      },
    });

    if (emailError) {
      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending OTP:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "Failed to send OTP" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
