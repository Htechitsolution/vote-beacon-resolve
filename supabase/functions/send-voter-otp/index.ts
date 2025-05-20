
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
    
    console.log(`Sending OTP email to ${email} with code: ${otp}`);
    
    // In a production environment, you would use a proper email service here
    // For now, we'll just log the OTP and return a success response
    console.log({
      to: email,
      subject: `Your login code for ${projectName}`,
      name: name,
      otp: otp,
      votingLink: votingLink
    });
    
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
