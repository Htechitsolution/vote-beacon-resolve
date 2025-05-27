
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";

const VoterVerify = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { pendingVoterEmail, verifyVoterOTP, user } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/voter-dashboard');
      return;
    }
    
    // Redirect if no pending email (means user didn't go through the login flow)
    if (!pendingVoterEmail) {
      navigate('/voter-login');
    }
  }, [pendingVoterEmail, navigate, user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }
    
    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const success = await verifyVoterOTP(otp);
      
      if (success) {
        toast.success("Login successful!");
        navigate('/voter-dashboard');
      } else {
        setError("Invalid OTP. Please try again.");
        toast.error("Invalid OTP. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Verification failed");
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="w-full max-w-md p-6 md:p-8 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="flex justify-center mb-6">
            <div className="bg-evoting-100 p-3 rounded-full">
              <KeyRound className="h-8 w-8 text-evoting-600" />
            </div>
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">Verify Your Identity</h2>
          {pendingVoterEmail && (
            <p className="text-center text-gray-600 mb-6">
              Enter the 6-digit code for <strong>{pendingVoterEmail}</strong>
            </p>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="text-center text-lg tracking-widest"
                required
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-evoting-600 hover:bg-evoting-700 text-white"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            
            <div className="mt-4 text-center">
              <Button 
                type="button" 
                variant="ghost"
                className="text-evoting-600 hover:text-evoting-800 text-sm font-medium"
                onClick={() => navigate('/voter-login')}
              >
                Back to Login
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Testing mode: Check the console for the OTP</p>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VoterVerify;
