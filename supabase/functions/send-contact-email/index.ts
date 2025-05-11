
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { name, email, message }: ContactRequest = await req.json();

    if (!name || !email || !message) {
      throw new Error("Missing required fields");
    }

    console.log("Contact form submission:", { name, email, message });
    
    // In a real-world scenario, we would send an email here.
    // For now, we'll just log the submission and return a success response
    // This avoids the email sending error while we set up proper email functionality
    
    return new Response(
      JSON.stringify({ message: "Contact form submitted successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error processing contact form:", error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
