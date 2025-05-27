
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";

const VoterDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  
  useEffect(() => {
    if (!profile) {
      navigate('/voter-login');
    }
  }, [profile, navigate]);

  if (!profile) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome, Voter</CardTitle>
              <CardDescription>
                You are logged in as {profile.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                This is your voting dashboard. Here you will see meetings for which you have been invited to vote.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </CardFooter>
          </Card>
          
          {/* Meeting list will go here */}
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">No active meetings found.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VoterDashboard;
