
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
  votingLink?: string;
  isResultEmail?: boolean;
  resultTitle?: string;
  resultUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      otp, 
      voterName, 
      projectName, 
      votingLink, 
      isResultEmail, 
      resultTitle,
      resultUrl 
    } = await req.json() as EmailRequest;
    
    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Processing email to ${email} for project ${projectName}`);

    // Create Supabase client to call our email service
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call our email-service edge function
    const { data, error } = await supabase.functions.invoke('email-service', {
      body: {
        to: email,
        subject: isResultEmail 
          ? `Voting Results for ${projectName} - ${resultTitle || "Meeting"}`
          : votingLink 
            ? `Your Voting Link and OTP for ${projectName} Meeting - ${otp}`
            : `Your OTP for ${projectName} Meeting - ${otp}`,
        html: isResultEmail && resultUrl 
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Voting Results</h2>
              <p>Hello ${voterName || "Voter"},</p>
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
          ` 
          : votingLink 
            ? `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Your Voting Information</h2>
                <p>Hello ${voterName || "Voter"},</p>
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
            `
            : `
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
            `
      }
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log(`Email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
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
