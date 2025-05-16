import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin } from "lucide-react";

const ContactUs = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call the edge function to handle the contact form submission
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name,
          email,
          message
        }
      });
      
      if (error) throw error;
      
      toast.success("Message sent! We'll get back to you soon.");
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error.message);
      toast.error(error.message || "Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-grow py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
            <p className="text-gray-600">Get in touch with our team for any questions or inquiries</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  {submitted ? (
                    <div className="text-center py-8">
                      <h2 className="text-2xl font-bold text-evoting-600 mb-4">Thank You!</h2>
                      <p className="text-gray-700 mb-6">
                        We've received your message and will get back to you as soon as possible.
                      </p>
                      <Button 
                        onClick={() => setSubmitted(false)}
                        className="bg-evoting-600 hover:bg-evoting-700 text-white"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name</Label>
                          <Input 
                            id="name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea 
                          id="message"
                          placeholder="Write your message here..."
                          rows={6}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                        />
                      </div>
                      
                      <Button 
                        type="submit"
                        className="w-full md:w-auto bg-evoting-600 hover:bg-evoting-700 text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-evoting-600 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">Email</p>
                        <a href="mailto:info@the-evoting.com" className="text-evoting-600 hover:underline">
                          info@the-evoting.com
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-evoting-600 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <a href="tel:+1234567890" className="text-evoting-600 hover:underline">
                          +1 (234) 567-890
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-evoting-600 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">Office</p>
                        <p className="text-gray-600">
                          123 Voting Street<br />
                          San Francisco, CA 94107<br />
                          United States
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Hours of Operation</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 9am - 5pm<br />
                      Saturday & Sunday: Closed
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContactUs;
