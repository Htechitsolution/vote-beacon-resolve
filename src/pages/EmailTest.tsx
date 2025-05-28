
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
              Email Service Test - Free Gmail SMTP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gmail Setup Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Gmail Setup Required:</h3>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>Go to your Google Account settings</li>
                <li>Enable 2-Factor Authentication (2FA)</li>
                <li>Go to Security → App passwords</li>
                <li>Generate a new App Password for "Mail"</li>
                <li>Use your Gmail address as EMAIL_USER</li>
                <li>Use the generated App Password as EMAIL_PASSWORD</li>
              </ol>
              <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                <strong>Note:</strong> This uses Gmail's free SMTP service - no paid services required!
              </div>
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

            {/* Detailed Setup Instructions */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-2">Step-by-Step Gmail Setup:</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Account Security</a></li>
                <li>Enable "2-Step Verification" if not already enabled</li>
                <li>Scroll to "App passwords" and click it</li>
                <li>Select "Mail" from the dropdown and click "Generate"</li>
                <li>Copy the 16-character app password</li>
                <li>In Supabase → Settings → Edge Functions → Secrets:</li>
                <li className="ml-4">Add EMAIL_USER = your.email@gmail.com</li>
                <li className="ml-4">Add EMAIL_PASSWORD = the 16-character app password</li>
                <li>Test the email service using this form</li>
              </ol>
            </div>

            {/* Common Issues */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Common Issues:</h3>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>Make sure 2FA is enabled on your Gmail account</li>
                <li>Use App Password, not your regular Gmail password</li>
                <li>Check Edge Function logs if emails fail to send</li>
                <li>Gmail has daily sending limits for free accounts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailTest;
