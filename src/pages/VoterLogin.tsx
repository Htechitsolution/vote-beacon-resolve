
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
import { HelpCircle, Mail, RefreshCw, Send, Vote as VoteIcon } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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
  const [generatedOtp, setGeneratedOtp] = useState(""); // Store the generated OTP for testing
  
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
    
    // Show OTP input field immediately
    setShowOtpInput(true);
    
    // Start sending OTP process
    setSendingOtp(true);
    console.log("Sending OTP for email:", email, "projectId:", projectId);
    
    try {
      // Generate a 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(generatedOtp);
      console.log("🔑 TESTING OTP:", generatedOtp);
      
      // Try to identify if the voter exists
      let voterData;
      
      if (projectId) {
        // If there's a specific project ID, check if the voter exists for that project
        const { data, error } = await supabase
          .from('voters')
          .select('*')
          .eq('email', email)
          .eq('project_id', projectId)
          .single();
          
        if (!error || error.code !== 'PGRST116') {
          voterData = data;
        }
      }
      
      // If no voter found in the specific project or no projectId provided,
      // check if voter exists in any project
      if (!voterData) {
        const { data: anyVoterData, error: anyVoterError } = await supabase
          .from('voters')
          .select('*')
          .eq('email', email)
          .limit(1);
          
        if (!anyVoterError && anyVoterData?.length > 0) {
          voterData = anyVoterData[0];
        }
      }
      
      // Store OTP in the database - handle errors gracefully
      try {
        // Store OTP in the database with expiration time (15 mins)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        
        if (voterData?.id) {
          console.log("Storing OTP for existing voter:", voterData.id);
          
          // Store the OTP in the voter_otps table for existing voter
          await supabase.rpc('create_voter_otp', {
            v_voter_id: voterData.id,
            v_email: email,
            v_otp: generatedOtp,
            v_expires_at: expiresAt.toISOString()
          });
        } else {
          // For non-existent voters, directly insert into voter_otps table without voter_id
          const { error: insertError } = await supabase
            .from('voter_otps')
            .insert({
              email: email,
              otp: generatedOtp,
              expires_at: expiresAt.toISOString(),
              used: false
            });
          
          if (insertError) {
            console.error("Error storing OTP in database:", insertError);
          }
        }
      } catch (dbError: any) {
        // Log the error but continue - we still have the OTP in memory
        console.error("Error storing OTP in database:", dbError);
      }
      
      // Prepare the voting link - this will be used in the email
      const votingLink = `${window.location.origin}/projects/${projectId || 'all'}/voter-login`;
      
      // Send OTP via email using our edge function
      try {
        const { data, error: functionError } = await supabase.functions.invoke('send-voter-otp', {
          body: { 
            email: email,
            otp: generatedOtp,
            name: voterData?.name || email.split('@')[0],
            projectName: projectName || "eVoting Platform",
            votingLink: votingLink
          }
        });
        
        if (functionError) {
          console.error("Edge function error:", functionError);
          toast.warning("Email might not be sent, but check console for OTP");
        } else {
          console.log("OTP sent response:", data);
          toast.success("A one-time password has been sent to your email");
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        toast.warning("Email might not be sent, but check console for OTP");
      }
    } catch (error: any) {
      console.error("Error in OTP flow:", error.message);
      // Even if there's an error, we keep showing the OTP input
      toast.error("There was an issue sending the OTP, but you can still enter it if you received it");
    } finally {
      setSendingOtp(false);
    }
  };
  
  const handleVerifyOTP = async () => {
    if (!email || !otp) {
      toast.error("Please enter your email and OTP");
      return;
    }
    
    try {
      setLoading(true);
      
      // Verify OTP using the database
      const { data: otpData, error: otpQueryError } = await supabase
        .from('voter_otps')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (otpQueryError) {
        console.error("OTP verification error:", otpQueryError);
        throw new Error('Failed to verify OTP. Please try again.');
      }
      
      if (!otpData) {
        throw new Error('Invalid or expired OTP. Please request a new one.');
      }
      
      // Mark the OTP as used
      await supabase
        .from('voter_otps')
        .update({ used: true })
        .eq('id', otpData.id);
      
      // Check if voter exists with the given email
      const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('*')
        .eq('email', email)
        .limit(1);
        
      if (voterError) throw voterError;
      
      // If no voter data found, create a temporary session
      const voter = voterData?.[0] || {
        id: crypto.randomUUID(),
        email: email,
        name: email.split('@')[0],
        status: 'temporary',
        project_id: projectId || null,
        company_name: '',
        voting_weight: 1
      };
      
      // Store voter info in session storage
      sessionStorage.setItem('voter', JSON.stringify({
        id: voter.id,
        email: voter.email,
        name: voter.name,
        project_id: voter.project_id,
        company_name: voter.company_name,
        voting_weight: voter.voting_weight
      }));
      
      // If voter exists in the database, update their status to active
      if (voterData?.length > 0) {
        await supabase
          .from('voters')
          .update({ status: 'active' })
          .eq('id', voter.id);
      }
      
      // Redirect to voter dashboard
      navigate('/projects/' + (projectId || 'all') + '/voter-dashboard');
      
      toast.success("Login successful!");
      
    } catch (error: any) {
      console.error("Login error:", error.message);
      toast.error(error.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <VoteIcon className="text-evoting-600 h-6 w-6" />
            <span className="text-2xl font-bold bg-clip-text text-evoting-800">
              The-Evoting
            </span>
          </div>
        </div>
      </header>
      
      <div className="flex-grow flex items-center justify-center p-4"
           style={{
             backgroundImage: "url('https://images.unsplash.com/photo-1541435469116-8ce8ccc4ff85?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.0.3')",
             backgroundSize: "cover",
             backgroundPosition: "center",
             position: "relative"
           }}>
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
        
        <Card className="w-full max-w-md shadow-xl border-0 relative z-10">
          <CardHeader className="space-y-1 pb-4 text-center">
            <CardTitle className="text-2xl font-bold text-evoting-800">Voter Login</CardTitle>
            <CardDescription>
              {projectName ? `Enter your credentials for ${projectName}` : 'Enter your voter credentials'}
            </CardDescription>
            
            {/* Testing OTP display - Only shown in development */}
            {generatedOtp && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
                <p className="text-sm font-mono text-yellow-800">Testing OTP: {generatedOtp}</p>
              </div>
            )}
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
            </div>
          </CardContent>
        </Card>
      </div>
      
      <footer className="bg-gray-50 py-6 text-center text-sm text-gray-500">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} The-eVoting. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default VoterLogin;
