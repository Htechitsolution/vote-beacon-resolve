
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  otp: string;
  voterName: string;
  projectName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, voterName, projectName } = await req.json() as EmailRequest;
    
    if (!email || !otp) {
      throw new Error("Email and OTP are required");
    }

    console.log(`Sending OTP ${otp} to ${email} for project ${projectName}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Send email using Supabase Auth's built-in email service
    const { error } = await supabaseClient.auth.admin.sendRawEmail({
      email,
      subject: `Your OTP for ${projectName} Meeting - ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Your One-Time Password</h2>
          <p>Hello ${voterName || "Voter"},</p>
          <p>You have requested to login to the <strong>${projectName}</strong> meeting. Use the following One-Time Password (OTP) to complete your login:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 4px;">
            ${otp}
          </div>
          <p><strong>This OTP is valid for 15 minutes.</strong></p>
          <p>If you didn't request this login, please ignore this email or contact the meeting administrator.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #777; text-align: center;">This is an automated message, please do not reply to this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log(`OTP sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
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
