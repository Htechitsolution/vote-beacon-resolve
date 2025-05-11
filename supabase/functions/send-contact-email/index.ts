
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

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
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const { name, email, message }: ContactRequest = await req.json();

    if (!name || !email || !message) {
      throw new Error("Missing required fields");
    }

    console.log("Sending contact email with data:", { name, email, message });

    // Store the contact message in a database table
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert([{ name, email, message, created_at: new Date().toISOString() }]);

    if (dbError) {
      console.error("Error storing contact message:", dbError);
      // Continue anyway to try sending the email
    }

    // Use the more reliable built-in email function
    const { error } = await supabase.functions.invoke("send-custom-email", {
      body: {
        to: "harshalgandhi12@gmail.com",
        subject: `Contact Form Submission from ${name}`,
        html: `
          <h1>New Contact Form Submission</h1>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br />")}</p>
        `,
      },
    });

    if (error) {
      console.error("Error invoking send-custom-email function:", error);
      throw new Error("Failed to send email: " + error.message);
    }

    console.log("Email sent successfully");
    
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
