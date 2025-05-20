
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { isValidEmail } from "@/lib/utils";

const VoterLogin = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const { initiateVoterLogin, user } = useAuth();
  
  // If user is already logged in, redirect to voter dashboard
  useEffect(() => {
    if (user) {
      navigate('/voter-dashboard');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      // Generate and send OTP
      await initiateVoterLogin(email);
      
      setShowSuccess(true);
      toast.success("OTP sent successfully!");
      setTimeout(() => {
        navigate('/voter-verify');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send OTP");
      setError("Failed to send OTP. Please try again.");
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
              <Mail className="h-8 w-8 text-evoting-600" />
            </div>
          </div>
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">Voter Login</h2>
          <p className="text-center text-gray-600 mb-6">
            Enter your email to receive a one-time password
          </p>
          
          {showSuccess ? (
            <div className="bg-green-50 p-4 rounded-md mb-4 text-center border border-green-100">
              <p className="text-green-800">
                OTP sent successfully! Redirecting...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Are you an admin?{" "}
              <Link to="/login" className="text-evoting-600 hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VoterLogin;
