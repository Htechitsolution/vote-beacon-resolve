
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, isLoading, user } = useAuth();

  useEffect(() => {
    // Redirect to projects if already logged in
    if (user) {
      navigate('/projects');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Pass 'admin' as the role since this is the admin login page
    await signIn(email, password, 'admin');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="w-full max-w-md p-6 md:p-8 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
            <p className="text-gray-600">Sign in to your account to manage meetings</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Input 
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex justify-end">
              <Link 
                to="/forgot-password"
                className="text-sm text-evoting-600 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-evoting-600 hover:bg-evoting-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-evoting-600 hover:underline">
                Create one
              </Link>
            </p>
            <p className="mt-3 text-gray-600">
              Are you a voter?{" "}
              <Link to="/voter-login" className="text-evoting-600 hover:underline">
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

export default Login;
