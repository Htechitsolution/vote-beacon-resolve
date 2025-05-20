
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Vote as VoteIcon, EyeOff, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/layout/Footer";

const VoterLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldResetPassword, setShouldResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Check if voter is already logged in
    const voterSession = localStorage.getItem('voterSession');
    if (voterSession) {
      navigate('/voter-dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Check if voter exists
      const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('id, name, password, force_reset_password')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (voterError) {
        console.error("Error checking voter:", voterError);
        toast.error("An error occurred while checking voter credentials");
        return;
      }
      
      if (!voterData) {
        toast.error("Invalid email or password");
        return;
      }
      
      // Basic password verification - in a real app, you'd use bcrypt or similar
      if (voterData.password !== password) {
        toast.error("Invalid email or password");
        return;
      }
      
      // If force password reset is required
      if (voterData.force_reset_password) {
        setCurrentUserId(voterData.id);
        setShouldResetPassword(true);
        return;
      }
      
      // Login successful, create session
      localStorage.setItem('voterSession', JSON.stringify({
        voterId: voterData.id,
        email,
        loggedInAt: new Date().toISOString(),
        name: voterData.name
      }));
      
      toast.success("Logged in successfully");
      navigate('/voter-dashboard');
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update password in the database
      const { error } = await supabase
        .from('voters')
        .update({ 
          password: newPassword,
          force_reset_password: false
        })
        .eq('id', currentUserId);
      
      if (error) {
        throw error;
      }
      
      // Create session
      localStorage.setItem('voterSession', JSON.stringify({
        voterId: currentUserId,
        email,
        loggedInAt: new Date().toISOString()
      }));
      
      toast.success("Password updated successfully");
      navigate('/voter-dashboard');
      
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
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
          {!shouldResetPassword ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Voter Login</h1>
                <p className="text-gray-600">Enter your email and password to access your voting portal</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit"
                  className="w-full bg-evoting-600 hover:bg-evoting-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
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
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Change Your Password</h1>
                <p className="text-gray-600">Please create a new password for your account</p>
              </div>
              
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button 
                  type="submit"
                  className="w-full bg-evoting-600 hover:bg-evoting-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default VoterLogin;
