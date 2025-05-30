
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailPayload {
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
    const admin_email = Deno.env.get("ADMIN_EMAIL") || Deno.env.get("EMAIL_USER");

    if (!admin_email) {
      console.error("Missing admin email");
      throw new Error("Admin email not configured");
    }

    const payload: ContactEmailPayload = await req.json();
    const { name, email, message } = payload;

    console.log(`Processing contact form submission from ${email}`);

    // HTML email template for admin
    const adminHtmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4f46e5;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px;">
          ${message.replace(/\n/g, '<br />')}
        </div>
      </div>
    `;

    // HTML email template for confirmation to sender
    const confirmationHtmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4f46e5;">Thank You for Contacting Us</h2>
        <p>Hello ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>Your message:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; font-style: italic;">
          ${message.replace(/\n/g, '<br />')}
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          This is an automated confirmation. Please do not reply to this email.
        </p>
      </div>
    `;

    // Send the email to admin using centralized email service
    const { data: adminEmailData, error: adminEmailError } = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-service`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
        },
        body: JSON.stringify({
          to: admin_email,
          subject: `Contact Form: Message from ${name}`,
          body: adminHtmlBody,
          type: "contact",
          replyTo: email
        })
      }
    ).then(res => res.json());

    if (adminEmailError) {
      throw new Error(`Admin email error: ${adminEmailError.message}`);
    }

    // Send confirmation email to user
    const { data: userEmailData, error: userEmailError } = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-service`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
        },
        body: JSON.stringify({
          to: email,
          subject: "We've Received Your Message - The-eVoting",
          body: confirmationHtmlBody,
          type: "contact"
        })
      }
    ).then(res => res.json());

    if (userEmailError) {
      throw new Error(`User confirmation email error: ${userEmailError.message}`);
    }

    console.log(`Successfully processed contact form from ${email}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Contact form processed successfully"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error processing contact form:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error.message || "Failed to process contact form"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
