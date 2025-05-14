import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// Import our email service
import { sendEmail } from '@/lib/emailUtils';

const VoterLogin = () => {
  const { projectId, voterId } = useParams<{ projectId: string; voterId: string }>();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [voter, setVoter] = useState<any>(null);

  useEffect(() => {
    const loadVoter = async () => {
      if (!projectId || !voterId) {
        toast.error("Project or Voter ID is missing");
        return;
      }

      try {
        const { data: voterData, error: voterError } = await supabase
          .from('voters')
          .select('*, projects(title)')
          .eq('id', voterId)
          .eq('project_id', projectId)
          .single();

        if (voterError) throw voterError;

        if (!voterData) {
          toast.error("Voter not found");
          return;
        }

        setVoter(voterData);
      } catch (error: any) {
        console.error("Error loading voter:", error.message);
        toast.error("Failed to load voter information");
      }
    };

    loadVoter();
  }, [projectId, voterId]);

  // Update the sendOtp function to use our new email service
  const sendOtp = async () => {
    try {
      setIsSendingOtp(true);
      
      if (!voter) {
        toast.error("Voter information not found");
        return;
      }
      
      // Generate OTP (6 digits)
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiration time (15 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      // Call the create_voter_otp function
      const { error: otpError } = await supabase.rpc('create_voter_otp', {
        v_voter_id: voter.id,
        v_email: voter.email,
        v_otp: generatedOtp,
        v_expires_at: expiresAt.toISOString()
      });
      
      if (otpError) throw otpError;
      
      // Send email with OTP using our new email service
      const { success, error } = await sendEmail(
        voter.email,
        `Your OTP for ${voter.project?.title || 'Meeting'} - ${generatedOtp}`,
        'voterOtp',
        {
          recipientName: voter.name || 'Voter',
          projectName: voter.project?.title || 'Meeting',
          otp: generatedOtp
        }
      );
      
      if (!success) {
        throw new Error(error || "Failed to send email");
      }
      
      toast.success(`OTP sent to ${voter.email}`);
      setOtpSent(true);
      
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(`Failed to send OTP: ${error.message}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async (voterId: string, otp: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('voter_otps')
        .select('*')
        .eq('voter_id', voterId)
        .eq('otp', otp)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      if (!data || data.length === 0) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (!voter) {
        toast.error("Voter information not found");
        return;
      }

      const isValidOtp = await verifyOtp(voter.id, otp);

      if (!isValidOtp) {
        toast.error("Invalid OTP. Please try again.");
        return;
      }

      // Store voter info in local storage
      localStorage.setItem('voter', JSON.stringify(voter));

      // Redirect to the voting page
      navigate(`/projects/${projectId}/meeting`);
    } catch (error: any) {
      console.error("Error during login:", error.message);
      toast.error("Failed to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update the UI to show OTP input once it's sent
  if (!voter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold">Loading voter information...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Voter Login</h1>
            {voter.project && (
              <p className="text-gray-600 mt-1">{voter.project.title}</p>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
              <Label className="block text-sm font-medium mb-1">Email</Label>
              <Input type="email" value={voter.email} readOnly disabled />
            </div>
            
            {!otpSent ? (
              <Button 
                className="w-full" 
                onClick={sendOtp}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP to Email"
                )}
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="otp" className="block text-sm font-medium">One-Time Password</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800" 
                      onClick={sendOtp}
                      disabled={isSendingOtp}
                    >
                      {isSendingOtp ? "Sending..." : "Resend OTP"}
                    </Button>
                  </div>
                  
                  <div className="flex justify-center py-4">
                    <InputOTP 
                      maxLength={6} 
                      value={otp} 
                      onChange={setOtp}
                      disabled={isSubmitting}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleSubmit}
                    disabled={otp.length !== 6 || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Login"
                    )}
                  </Button>
                </div>
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  <p>OTP has been sent to your email address.</p>
                  <p>Please check your inbox and spam folder.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterLogin;
