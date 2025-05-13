
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const VoterLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Voter@1234'); // Default password
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Please enter your email",
        description: "Email is required to log in"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // First check if the voter exists in the system
      const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('email, project_id')
        .eq('email', email.trim().toLowerCase());
      
      if (voterError) throw voterError;
      
      if (!voterData || voterData.length === 0) {
        toast({
          title: "Error",
          description: "This email is not registered as a voter for any meetings",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        // If error is about invalid credentials, the user might not exist yet
        if (error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: {
                role: 'voter'
              }
            }
          });
          
          if (signUpError) throw signUpError;
          
          toast({
            title: "Success",
            description: "Account created successfully! Please login now."
          });
          
          // Try login again
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          
          if (loginError) throw loginError;
          
          toast({
            title: "Success",
            description: "Logged in successfully"
          });
          navigate('/voter-dashboard');
        } else {
          throw error;
        }
      } else {
        // Update voter status to active
        await supabase
          .from('voters')
          .update({ status: 'active' })
          .eq('email', email.trim().toLowerCase());
        
        toast({
          title: "Success",
          description: "Logged in successfully"
        });
        navigate('/voter-dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex items-center justify-center px-4 py-12 bg-[url('/background.jpg')] bg-cover bg-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white drop-shadow-md">Voter Login</h1>
            <p className="mt-2 text-gray-100 drop-shadow-md">
              Login with your email to access meetings and cast your votes
            </p>
          </div>
          
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Enter your email to access your meetings
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <span className="text-xs text-gray-500">Pre-configured</span>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled
                    className="h-11 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Using default password: Voter@1234</p>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  className="w-full h-11 text-base bg-evoting-600 hover:bg-evoting-700" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Log In as Voter"}
                </Button>
                
                <div className="w-full text-center space-y-2">
                  <p className="text-sm text-gray-500">
                    Are you an administrator?
                  </p>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/login">Admin Login</Link>
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VoterLogin;
