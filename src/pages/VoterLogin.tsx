
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { toast } from "@/components/ui/use-toast";
import { HelpCircle, Mail } from "lucide-react";

const VoterLogin = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [email, setEmail] = useState("");
  const [voterId, setVoterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");
  
  useEffect(() => {
    const fetchProjectName = async () => {
      if (!projectId) return;
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('title')
          .eq('id', projectId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setProjectName(data.title);
        }
      } catch (error: any) {
        console.error("Error fetching project:", error.message);
        toast("Error", {
          description: "Failed to load project information",
        });
      }
    };
    
    fetchProjectName();
  }, [projectId]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !voterId) {
      toast("Error", {
        description: "Please enter your email and voter ID",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if voter exists with given email and voter_id
      const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('*')
        .eq('email', email)
        .eq('voter_id', voterId)
        .eq('project_id', projectId)
        .single();
        
      if (voterError) {
        if (voterError.message.includes('No rows found')) {
          throw new Error('Invalid credentials. Please check your email and voter ID.');
        }
        throw voterError;
      }
      
      if (!voterData) {
        throw new Error('Invalid credentials. Please check your email and voter ID.');
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
      
      toast("Success", {
        description: "Login successful!",
      });
      
    } catch (error: any) {
      console.error("Login error:", error.message);
      toast("Error", {
        description: error.message || "Failed to login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-evoting-50 to-evoting-100 flex items-center justify-center p-4"
         style={{
           backgroundImage: "url('https://images.unsplash.com/photo-1541435469116-8ce8ccc4ff85?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.0.3')",
           backgroundSize: "cover",
           backgroundPosition: "center"
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
          <form onSubmit={handleLogin}>
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
              
              <div className="space-y-2">
                <label htmlFor="voter-id" className="text-sm font-medium text-gray-700">Voter ID</label>
                <Input
                  id="voter-id"
                  type="password"
                  placeholder="Enter your voter ID"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-evoting-600 hover:bg-evoting-700 text-white"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
          
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
  );
};

export default VoterLogin;
