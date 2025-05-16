
import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HelpCircle, Mail, RefreshCw, Send } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const VoterLogin = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [projectName, setProjectName] = useState("");
  
  useEffect(() => {
    const fetchProjectName = async () => {
      if (!projectId) {
        console.log("No projectId provided, cannot fetch project");
        return;
      }
      
      try {
        console.log("Fetching project data for:", projectId);
        const { data, error } = await supabase
          .from('projects')
          .select('title')
          .eq('id', projectId)
          .single();
          
        if (error) {
          console.error("Error fetching project:", error);
          throw error;
        }
        
        if (data) {
          console.log("Project data retrieved:", data);
          setProjectName(data.title);
        }
      } catch (error: any) {
        console.error("Error fetching project:", error.message);
        toast.error("Failed to load project information");
      }
    };
    
    fetchProjectName();
  }, [projectId]);
  
  const handleSendOTP = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!projectId) {
      toast.error("Project ID is missing. Please check the URL");
      console.error("Project ID is missing - current projectId:", projectId);
      return;
    }
    
    try {
      setSendingOtp(true);
      console.log("Sending OTP for email:", email, "projectId:", projectId);
      
      // Check if voter exists with given email
      const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('*')
        .eq('email', email)
        .eq('project_id', projectId)
        .single();
        
      if (voterError) {
        console.error("Voter error:", voterError);
        if (voterError.code === 'PGRST116') {
          throw new Error('No voter found with this email address');
        }
        throw voterError;
      }
      
      // Generate a 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in the database with expiration time (15 mins)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      console.log("Storing OTP for voter:", voterData.id);
      
      // Store the OTP in the voter_otps table
      const { error: otpError } = await supabase.rpc('create_voter_otp', {
        v_voter_id: voterData.id,
        v_email: email,
        v_otp: generatedOtp,
        v_expires_at: expiresAt.toISOString()
      });
      
      if (otpError) {
        console.error("OTP storage error:", otpError);
        throw otpError;
      }
      
      // Prepare the voting link - this will be used in the email
      const votingLink = `${window.location.origin}/projects/${projectId}/voter-login`;
      
      console.log("Sending OTP via edge function");
      
      // Send OTP via email using our edge function
      const { data, error: functionError } = await supabase.functions.invoke('send-voter-otp', {
        body: { 
          email: email,
          otp: generatedOtp,
          name: voterData.name,
          projectName: projectName,
          votingLink: votingLink
        }
      });
      
      if (functionError) {
        console.error("Edge function error:", functionError);
        throw functionError;
      }
      
      console.log("OTP sent response:", data);
      
      setShowOtpInput(true);
      toast.success("A one-time password has been sent to your email");
      
    } catch (error: any) {
      console.error("Error sending OTP:", error.message);
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };
  
  const handleVerifyOTP = async () => {
    if (!email || !otp) {
      toast.error("Please enter your email and OTP");
      return;
    }
    
    if (!projectId) {
      toast.error("Project ID is missing. Please check the URL");
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if voter exists
      const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('*')
        .eq('email', email)
        .eq('project_id', projectId)
        .single();
        
      if (voterError) throw voterError;
      
      // Verify OTP
      const { data: otpData, error: otpError } = await supabase.rpc('verify_voter_otp', {
        v_voter_id: voterData.id,
        v_otp: otp
      });
        
      if (otpError) {
        throw new Error('Invalid or expired OTP. Please request a new one.');
      }
      
      if (!otpData) {
        throw new Error('Invalid or expired OTP. Please request a new one.');
      }
      
      // Store voter info in session storage
      sessionStorage.setItem('voter', JSON.stringify({
        id: voterData.id,
        email: voterData.email,
        name: voterData.name,
        project_id: voterData.project_id,
        company_name: voterData.company_name,
        voting_weight: voterData.voting_weight
      }));
      
      // Update voter status to active
      await supabase
        .from('voters')
        .update({ status: 'active' })
        .eq('id', voterData.id);
      
      // Redirect to voter dashboard
      navigate(`/projects/${projectId}/voter-dashboard`);
      
      toast.success("Login successful!");
      
    } catch (error: any) {
      console.error("Login error:", error.message);
      toast.error(error.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-grow flex items-center justify-center p-4"
           style={{
             backgroundImage: "url('https://images.unsplash.com/photo-1541435469116-8ce8ccc4ff85?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.0.3')",
             backgroundSize: "cover",
             backgroundPosition: "center",
             position: "relative"
           }}>
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
        
        <Card className="w-full max-w-md shadow-xl border-0 relative">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-bold text-evoting-800">Voter Login</CardTitle>
            <CardDescription>
              {projectName ? `Enter your credentials for ${projectName}` : 'Enter your voter credentials'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant={showOtpInput ? "outline" : "default"}
                  className={`w-full ${showOtpInput ? "bg-gray-100 hover:bg-gray-200 text-gray-700" : "bg-evoting-600 hover:bg-evoting-700 text-white"}`}
                  onClick={handleSendOTP}
                  disabled={sendingOtp || !email}
                >
                  {sendingOtp ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : showOtpInput ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend OTP
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send OTP
                    </>
                  )}
                </Button>
              </div>
              
              {showOtpInput && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <label htmlFor="otp" className="text-sm font-medium text-gray-700">One-Time Password</label>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="h-12 w-12" />
                          <InputOTPSlot index={1} className="h-12 w-12" />
                          <InputOTPSlot index={2} className="h-12 w-12" />
                          <InputOTPSlot index={3} className="h-12 w-12" />
                          <InputOTPSlot index={4} className="h-12 w-12" />
                          <InputOTPSlot index={5} className="h-12 w-12" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    className="w-full bg-evoting-600 hover:bg-evoting-700 text-white"
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                <HelpCircle className="inline-block mr-1 h-4 w-4" />
                Having trouble logging in? Contact your meeting administrator
              </p>
              <Button
                variant="ghost"
                className="mt-2 text-evoting-600"
                onClick={handleGoBack}
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default VoterLogin;
