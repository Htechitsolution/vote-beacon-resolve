
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Mail, CheckCircle, XCircle } from 'lucide-react';

const EmailTest = () => {
  const [formData, setFormData] = useState({
    to: '',
    subject: 'Test Email from The-eVoting',
    body: '<h2>Test Email</h2><p>This is a test email from The-eVoting platform.</p><p>If you received this, the email service is working correctly!</p>',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLastResult(null);

    try {
      console.log('Sending test email to:', formData.to);
      
      const { data, error } = await supabase.functions.invoke('email-service', {
        body: {
          to: formData.to,
          subject: formData.subject,
          body: formData.body,
          type: 'test'
        }
      });

      if (error) {
        console.error('Email sending error:', error);
        setLastResult({ success: false, message: error.message });
        toast({
          title: "Email Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Email sent successfully:', data);
      setLastResult({ success: true, message: data.message });
      toast({
        title: "Email Sent Successfully",
        description: "Test email has been sent successfully!"
      });

    } catch (error: any) {
      console.error('Exception in sending email:', error);
      const errorMessage = error.message || 'Failed to send a request to the Edge Function';
      setLastResult({ success: false, message: errorMessage });
      toast({
        title: "Email Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-evoting-600" />
              Email Service Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Configuration Status */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Configuration Required:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Set EMAIL_USER in Supabase secrets (your Gmail address)</li>
                <li>• Set EMAIL_PASSWORD in Supabase secrets (Gmail app password)</li>
                <li>• For Gmail: Enable 2FA and create an App Password</li>
              </ul>
            </div>

            {/* Test Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="to">To Email Address</Label>
                <Input
                  id="to"
                  type="email"
                  value={formData.to}
                  onChange={(e) => handleInputChange('to', e.target.value)}
                  placeholder="recipient@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Email subject"
                  required
                />
              </div>

              <div>
                <Label htmlFor="body">Email Body (HTML)</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  placeholder="Email content in HTML format"
                  rows={6}
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !formData.to.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </form>

            {/* Result Display */}
            {lastResult && (
              <div className={`p-4 rounded-lg border ${
                lastResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {lastResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    lastResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {lastResult.success ? 'Success' : 'Error'}
                  </span>
                </div>
                <p className={`text-sm ${
                  lastResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {lastResult.message}
                </p>
              </div>
            )}

            {/* Setup Instructions */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-2">Setup Instructions:</h3>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Go to Supabase Dashboard → Settings → Edge Functions</li>
                <li>Add secret: EMAIL_USER (your Gmail address)</li>
                <li>Add secret: EMAIL_PASSWORD (Gmail app password)</li>
                <li>For Gmail: Enable 2FA and generate App Password</li>
                <li>Test the email service using this form</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailTest;
