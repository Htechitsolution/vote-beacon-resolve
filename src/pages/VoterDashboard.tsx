
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Vote as VoteIcon, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/layout/Footer";

interface VoterSession {
  voterId: string;
  email: string;
  loggedInAt: string;
}

interface Agenda {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  project_id: string;
  project_name: string;
}

const VoterDashboard = () => {
  const navigate = useNavigate();
  const [voterSession, setVoterSession] = useState<VoterSession | null>(null);
  const [agendaItems, setAgendaItems] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if voter is logged in
    const sessionData = localStorage.getItem('voterSession');
    
    if (!sessionData) {
      toast.error("Please log in to access the voter dashboard");
      navigate('/voter-login');
      return;
    }
    
    try {
      const session = JSON.parse(sessionData) as VoterSession;
      setVoterSession(session);
      
      // Fetch agenda items where this voter is included
      fetchVoterAgendaItems(session.voterId, session.email);
    } catch (error) {
      console.error("Invalid session data:", error);
      localStorage.removeItem('voterSession');
      navigate('/voter-login');
    }
  }, [navigate]);

  const fetchVoterAgendaItems = async (voterId: string, voterEmail: string) => {
    try {
      setIsLoading(true);
      
      // First get all agendas
      const { data: agendas, error: agendasError } = await supabase
        .from('agendas')
        .select(`
          id,
          title,
          description,
          start_date,
          end_date,
          project_id,
          projects (name)
        `);
      
      if (agendasError) {
        throw agendasError;
      }
      
      // Then get all voters linked to agendas where this voter's email matches
      const { data: voterAgendas, error: voterAgendasError } = await supabase
        .from('voters')
        .select('agenda_id')
        .eq('email', voterEmail);
      
      if (voterAgendasError) {
        throw voterAgendasError;
      }
      
      // Filter agendas to only include those where this voter is included
      const agendaIds = voterAgendas.map(va => va.agenda_id);
      const filteredAgendas = agendas
        .filter(agenda => agendaIds.includes(agenda.id))
        .map(agenda => ({
          ...agenda,
          project_name: agenda.projects?.name || 'Unknown Project'
        }));
      
      setAgendaItems(filteredAgendas);
      
    } catch (error: any) {
      console.error("Error fetching agenda items:", error);
      toast.error(error.message || "Failed to load agenda items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('voterSession');
    toast.success("Logged out successfully");
    navigate('/voter-login');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header for Voter Dashboard */}
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VoteIcon className="text-evoting-600 h-19 w-19" />
            <span className="text-2xl font-bold bg-clip-text text-evoting-800">
              The-Evoting
            </span>
          </div>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1"
          >
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Your Voting Items</h1>
          <p className="text-gray-600">
            Welcome, {voterSession?.email}. Here are the agenda items you are invited to vote on.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading your voting items...</p>
          </div>
        ) : agendaItems.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">You have no voting items available at this time.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agendaItems.map((agenda) => (
              <Card key={agenda.id}>
                <CardHeader>
                  <CardTitle>{agenda.title}</CardTitle>
                  <CardDescription>{agenda.project_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">
                    {agenda.description?.substring(0, 100)}
                    {agenda.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="text-sm text-gray-500">
                    <div>Start: {new Date(agenda.start_date).toLocaleDateString()}</div>
                    <div>End: {new Date(agenda.end_date).toLocaleDateString()}</div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-evoting-600 hover:bg-evoting-700 text-white"
                    onClick={() => navigate(`/voter/agenda/${agenda.id}`)}
                  >
                    Vote Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default VoterDashboard;
