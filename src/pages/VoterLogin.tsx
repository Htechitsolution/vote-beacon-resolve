
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Vote as VoteIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/layout/Footer";
import { sendVoterOTP } from "@/lib/emailUtils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const VoterLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [voterId, setVoterId] = useState<string | null>(null);

  const handleGenerateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    try {
      setIsGeneratingOtp(true);
      
      // Check if voter exists using select syntax compatible with Supabase
      const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('id, name')
        .eq('email', email)
        .maybeSingle();
      
      if (voterError) {
        console.error("Error fetching voter:", voterError);
        toast.error("Error checking voter: " + voterError.message);
        return;
      }
      
      if (!voterData) {
        toast.error("No voter account found with this email");
        return;
      }
      
      // Generate a random 6-digit OTP
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomOtp);
      setVoterId(voterData.id);
      
      // Log OTP to console for testing
      console.log("Generated OTP for testing:", randomOtp);
      
      // Store OTP in database with 5-minute expiration
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 5);
      
      const { data: functionData, error: functionError } = await supabase.rpc(
        'create_voter_otp',
        {
          v_voter_id: voterData.id,
          v_email: email,
          v_otp: randomOtp,
          v_expires_at: expirationTime.toISOString()
        }
      );
      
      if (functionError) {
        console.error("Error storing OTP:", functionError);
        toast.error("Failed to generate OTP: " + functionError.message);
        return;
      }
      
      // Send OTP via email
      const { success, message } = await sendVoterOTP(
        email,
        voterData.name || 'Voter',
        randomOtp,
        "The-eVoting",
        window.location.origin
      );
      
      if (!success) {
        toast.error(message || "Failed to send OTP");
        return;
      }
      
      // Show OTP input field
      setShowOtpField(true);
      toast.success("OTP has been sent to your email");
      
    } catch (error: any) {
      console.error("Error generating OTP:", error);
      toast.error(error.message || "Failed to generate OTP");
    } finally {
      setIsGeneratingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    
    if (!voterId) {
      toast.error("Session expired, please try again");
      setShowOtpField(false);
      return;
    }
    
    try {
      setIsVerifyingOtp(true);
      
      // Verify OTP using database function
      const { data: isValid, error: verifyError } = await supabase.rpc(
        'verify_voter_otp',
        {
          v_voter_id: voterId,
          v_otp: otp
        }
      );
      
      if (verifyError) {
        console.error("Error verifying OTP:", verifyError);
        toast.error("Failed to verify OTP: " + verifyError.message);
        return;
      }
      
      if (isValid) {
        // Store voter session in local storage
        localStorage.setItem('voterSession', JSON.stringify({
          voterId,
          email,
          loggedInAt: new Date().toISOString()
        }));
        
        toast.success("Login successful");
        navigate('/voter-dashboard');
      } else {
        toast.error("Invalid or expired OTP. Please try again");
      }
      
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error(error.message || "Failed to verify OTP");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header for Voter Login */}
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <VoteIcon className="text-evoting-600 h-19 w-19" />
            <span className="text-2xl font-bold bg-clip-text text-evoting-800">
              The-Evoting
            </span>
          </Link>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="w-full max-w-md p-6 md:p-8 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Voter Login</h1>
            <p className="text-gray-600">Enter your email to receive a login code</p>
          </div>
          
          {!showOtpField ? (
            <form onSubmit={handleGenerateOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-evoting-600 hover:bg-evoting-700 text-white"
                disabled={isGeneratingOtp}
              >
                {isGeneratingOtp ? "Generating OTP..." : "Generate OTP"}
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-gray-600">
                  Are you an admin?{" "}
                  <Link to="/login" className="text-evoting-600 hover:underline">
                    Login here
                  </Link>
                </p>
                
                <Link to="/" className="text-sm text-evoting-600 hover:underline block mt-2">
                  Return to home page
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <div className="flex flex-col items-center gap-4">
                  <InputOTP 
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    maxLength={6}
                    render={({ slots }) => (
                      <InputOTPGroup>
                        {slots.map((slot, index) => (
                          <InputOTPSlot key={index} {...slot} index={index} />
                        ))}
                      </InputOTPGroup>
                    )}
                  />
                  <p className="text-xs text-gray-500">A 6-digit code has been sent to your email</p>
                </div>
              </div>
              
              <Button 
                type="submit"
                className="w-full bg-evoting-600 hover:bg-evoting-700 text-white"
                disabled={isVerifyingOtp}
              >
                {isVerifyingOtp ? "Verifying..." : "Login"}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-evoting-600 hover:underline"
                  onClick={() => {
                    setShowOtpField(false);
                    setOtp("");
                  }}
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default VoterLogin;
