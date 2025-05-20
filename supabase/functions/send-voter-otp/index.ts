
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

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  type: string;
  name?: string;
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
    
    // Create email HTML body
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Login Details for ${projectName}</h2>
        <p>Hello ${name},</p>
        <p>You have been invited to vote in: <strong>${projectName}</strong></p>
        <p>Your one-time password is: <strong style="font-size: 20px;">${otp}</strong></p>
        <p>Please click the link below to access the voting portal:</p>
        <p><a href="${votingLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Go to Voting Portal</a></p>
        <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
        <p>${votingLink}</p>
        <p>This login code will expire in 30 minutes.</p>
        <p>Thank you,<br>The-eVoting Team</p>
      </div>
    `;

    // Send the email using our centralized email service
    const emailPayload: EmailPayload = {
      to: email,
      subject: `Your login code for ${projectName}`,
      body: emailBody,
      type: "voter_otp",
      name: name
    };
    
    // Call the email-service function
    const { data, error } = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-service`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
        },
        body: JSON.stringify(emailPayload)
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
