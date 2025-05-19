
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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
    const email_user = Deno.env.get("EMAIL_USER");
    const email_password = Deno.env.get("EMAIL_PASSWORD");
    const admin_email = Deno.env.get("ADMIN_EMAIL") || email_user; // Email to receive contact form messages

    if (!email_user || !email_password) {
      console.error("Missing email credentials");
      throw new Error("Email service credentials not configured");
    }

    const payload: ContactEmailPayload = await req.json();
    const { name, email, message } = payload;

    console.log(`Processing contact form submission from ${email}`);

    // Setup SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: "us2.smtp.mailhostbox.com",
        port: 25,
        tls: false,
        auth: {
          username: email_user,
          password: email_password,
        },
      },
    });

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

    // Send the email to admin
    await client.send({
      from: `The-eVoting <${email_user}>`,
      to: admin_email,
      subject: `Contact Form: Message from ${name}`,
      content: "text/html",
      html: adminHtmlBody,
      replyTo: email,
    });

    // Send confirmation email to user
    await client.send({
      from: `The-eVoting <${email_user}>`,
      to: email,
      subject: "We've Received Your Message - The-eVoting",
      content: "text/html",
      html: confirmationHtmlBody,
    });

    await client.close();

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
