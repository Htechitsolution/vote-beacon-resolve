
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { sendEmail } from '@/lib/emailUtils';
import { toast } from 'sonner';
import { Mail, Send, Settings } from 'lucide-react';

const EmailTest = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState({
    to: '',
    subject: 'Test Email from The-eVoting System',
    body: 'This is a test email to verify the email configuration is working correctly.'
  });

  const logEmailSettings = () => {
    const emailSettings = {
      // User Information
      userId: user?.id || 'Not logged in',
      userEmail: user?.email || 'Not available',
      profileName: profile?.name || 'Not available',
      profileRole: profile?.role || 'Not available',
      
      // Email Configuration (from environment/system)
      emailUser: 'EMAIL_USER environment variable (hidden for security)',
      emailPassword: 'EMAIL_PASSWORD environment variable (hidden for security)',
      
      // SMTP Settings (based on Gmail configuration in edge function)
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      sslEnabled: true,
      tlsEnabled: true,
      authMethod: 'username/password',
      
      // Security Settings
      allowSelfSignedCerts: false,
      rejectUnauthorized: true,
      
      // Email Details
      from: 'The-eVoting <EMAIL_USER@gmail.com> (actual EMAIL_USER will be used)',
      to: testEmail.to,
      subject: testEmail.subject,
      
      // System Information
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      currentUrl: window.location.href,
      
      // Edge Function Details
      edgeFunctionEndpoint: 'email-service',
      edgeFunctionMethod: 'POST',
      corsEnabled: true,
      jwtVerification: false, // Based on config.toml
      
      // Important Notes
      notes: [
        'The actual EMAIL_USER and EMAIL_PASSWORD are stored in Supabase secrets',
        'Edge function uses EMAIL_USER as the from address',
        'Display name will be "The-eVoting" but sender email comes from EMAIL_USER secret',
        'Gmail SMTP requires app-specific password or OAuth2'
      ]
    };

    console.log('========== EMAIL CONFIGURATION LOG ==========');
    console.log(JSON.stringify(emailSettings, null, 2));
    console.log('=============================================');
    console.log('IMPORTANT: The edge function will use the actual EMAIL_USER and EMAIL_PASSWORD from Supabase secrets');
    console.log('Make sure EMAIL_USER and EMAIL_PASSWORD are properly set in your Supabase project secrets');
    
    return emailSettings;
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.to) {
      toast.error('Please enter a recipient email address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Log all email settings before sending
      const settings = logEmailSettings();
      
      // Send the test email
      const result = await sendEmail({
        to: testEmail.to,
        subject: testEmail.subject,
        body: testEmail.body,
        type: 'contact',
        name: profile?.name || user?.email || 'Test User'
      });

      if (result.success) {
        toast.success('Test email sent successfully!');
        console.log('Email sent successfully:', result);
      } else {
        toast.error(`Failed to send email: ${result.message}`);
        console.error('Email sending failed:', result);
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Mail className="h-8 w-8 text-evoting-600" />
              Email Testing Page
            </h1>
            <p className="text-gray-600">
              Test email functionality and view configuration details
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Test Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Test Email
                </CardTitle>
                <CardDescription>
                  Send a test email to verify the email service is working
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="to">To Email Address</Label>
                  <Input
                    id="to"
                    type="email"
                    placeholder="recipient@example.com"
                    value={testEmail.to}
                    onChange={(e) => setTestEmail({ ...testEmail, to: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={testEmail.subject}
                    onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="body">Message Body</Label>
                  <Textarea
                    id="body"
                    rows={4}
                    value={testEmail.body}
                    onChange={(e) => setTestEmail({ ...testEmail, body: e.target.value })}
                  />
                </div>
                
                <Button 
                  onClick={handleSendTestEmail}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Test Email'}
                </Button>
              </CardContent>
            </Card>

            {/* Configuration Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Current email settings and user information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User ID:</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {user?.id || 'Not logged in'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User Email:</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {user?.email || 'Not available'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">From Email:</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      The-eVoting &lt;EMAIL_USER&gt;
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Actual EMAIL_USER from Supabase secrets
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">SMTP Server:</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">smtp.gmail.com</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Port:</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">587</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">SSL/TLS:</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">Enabled (TLS)</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Authentication:</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">EMAIL_USER / EMAIL_PASSWORD</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Allow Self-Signed Certs:</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">False</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={logEmailSettings}
                    className="w-full mt-4"
                  >
                    Log Full Configuration to Console
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Instructions & Configuration Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Testing:</strong></p>
                <p>1. Enter a recipient email address in the form above</p>
                <p>2. Customize the subject and message if needed</p>
                <p>3. Click "Send Test Email" to send the email</p>
                <p>4. Check the browser console for detailed configuration logs</p>
                
                <p className="mt-4"><strong>Email Configuration:</strong></p>
                <p>• The edge function uses EMAIL_USER and EMAIL_PASSWORD from Supabase secrets</p>
                <p>• From address will be: The-eVoting &lt;EMAIL_USER@gmail.com&gt;</p>
                <p>• Make sure these secrets are properly configured in your Supabase project</p>
                <p>• Gmail requires an app-specific password for SMTP authentication</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailTest;
