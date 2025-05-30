
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VoterOtpRequest {
  email: string;
  name: string;
  otp: string;
  projectName: string;
  votingLink: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, otp, projectName, votingLink }: VoterOtpRequest = await req.json();

    // Basic validation
    if (!email || !otp) {
      return new Response(
        JSON.stringify({ 
          error: "Email and OTP are required" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Preparing to send OTP email to ${email} with code: ${otp}`);
    
    // Call the centralized email-service function
    const { data, error } = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-service`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
        },
        body: JSON.stringify({
          to: email,
          subject: `Your login code for ${projectName}`,
          type: "voter_otp",
          name: name,
          otp: otp,
          projectName: projectName,
          votingLink: votingLink
        })
      }
    ).then(res => res.json());
    
    if (error) {
      throw new Error(`Email service error: ${error.message}`);
    }
    
    console.log("Email sent successfully:", data);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "OTP email sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    console.error("Error sending voter OTP:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send OTP email" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
