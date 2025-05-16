
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
  projectName?: string;
  votingLink?: string;
  isResultEmail?: boolean;
  resultTitle?: string;
  resultUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received OTP request");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: OtpRequest = await req.json();
    const { email, name, otp, projectName, votingLink, isResultEmail, resultTitle, resultUrl } = payload;

    console.log("OTP request payload:", { email, name: name || "not provided", otp: otp ? "provided" : "missing", projectName, votingLink: votingLink ? "provided" : "missing" });

    if (!email) {
      throw new Error("Email is required");
    }

    const voterName = name || "Voter";
    let subject, body;

    if (isResultEmail) {
      subject = `Results for ${resultTitle || projectName || "Your Meeting"}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #1a73e8;">Meeting Results Available</h2>
          <p>Hello ${voterName},</p>
          <p>The results for "${resultTitle || "your meeting"}" are now available.</p>
          <p>You can view the results by clicking the button below:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resultUrl}" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Results</a>
          </div>
          <p>If you have any questions, please contact the meeting administrator.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `;
    } else {
      if (!otp) {
        throw new Error("OTP is required");
      }
      
      subject = `Your One-Time Password for ${projectName || "eVoting"}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #1a73e8;">Your One-Time Password (OTP)</h2>
          <p>Hello ${voterName},</p>
          <p>Please use the following OTP to login to the ${projectName || "eVoting"} portal:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 15 minutes.</p>
          ${votingLink ? `<p>To access the voting portal, <a href="${votingLink}" style="color: #1a73e8; text-decoration: none;">click here</a>.</p>` : ''}
          <p>If you did not request this OTP, please ignore this email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `;
    }

    console.log("Calling email-service function");

    // Call the email-service function to send the email
    const { data: emailData, error: emailError } = await supabase.functions.invoke("email-service", {
      body: {
        to: email,
        subject: subject,
        body: body,
        type: isResultEmail ? "voting_results" : "voter_otp",
      },
    });

    if (emailError) {
      console.error("Email service error:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: isResultEmail ? "Results email sent successfully" : "OTP sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "Failed to send email" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
