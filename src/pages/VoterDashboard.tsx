
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Vote, LogOut, Home } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Meeting {
  id: string;
  title: string;
  description: string;
  status: string;
  project_id: string;
  project_title: string;
}

const VoterDashboard = () => {
  const { user, profile } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [voterEmail, setVoterEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's voter information in session storage
    const voterData = sessionStorage.getItem('voter');
    if (voterData) {
      const voter = JSON.parse(voterData);
      setVoterEmail(voter.email);
      fetchMeetings(voter.email);
    } else if (user) {
      // Fallback to authenticated user if available
      setVoterEmail(user.email);
      fetchMeetings(user.email);
    } else {
      navigate('/voter-login');
    }
  }, [user]);

  const fetchMeetings = async (email: string) => {
    try {
      setLoading(true);
      if (!email) return;

      // Find projects where this voter is registered
      const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('project_id')
        .eq('email', email.toLowerCase());
      
      if (voterError) throw voterError;
      
      if (!voterData || voterData.length === 0) {
        console.log("No projects found for voter with email:", email);
        setLoading(false);
        return;
      }
      
      // Get unique project IDs
      const projectIds = [...new Set(voterData.map(v => v.project_id))];
      
      // Fetch meetings (agendas) for these projects
      const { data: agendaData, error: agendaError } = await supabase
        .from('agendas')
        .select('*, projects:project_id(title)')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });
        
      if (agendaError) throw agendaError;
      
      const formattedMeetings = agendaData.map(agenda => ({
        id: agenda.id,
        title: agenda.title,
        description: agenda.description || '',
        status: agenda.status || 'draft',
        project_id: agenda.project_id,
        project_title: agenda.projects?.title || 'Unknown Project'
      }));
      
      setMeetings(formattedMeetings);
    } catch (error: any) {
      console.error('Error fetching meetings:', error.message);
      toast.error("Failed to load your meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear voter session storage
      sessionStorage.removeItem('voter');
      
      // Also sign out from Supabase auth if user is logged in
      if (user) {
        await supabase.auth.signOut();
      }
      
      navigate('/voter-login');
      toast.success("Logged out successfully");
    } catch (error: any) {
      console.error('Logout error:', error.message);
      toast.error("Failed to log out");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="default" className="bg-green-500">Live</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-200">Closed</Badge>;
      default: // 'draft' or any other status
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="The-Evoting Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold text-evoting-800">The-Evoting</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2 hidden md:inline">{voterEmail}</span>
            <div className="flex space-x-2">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">Home</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your Meetings</h1>
          <p className="text-gray-600 mt-1">Welcome to your dashboard. Here are all the meetings you've been invited to.</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-evoting-600"></div>
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12">
              <img 
                src="/empty-meetings.svg" 
                alt="No meetings" 
                className="w-40 h-40 mx-auto mb-4 opacity-50" 
              />
              <h3 className="text-xl font-medium text-gray-600 mb-2">No meetings found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                You haven't been invited to any meetings yet. Please check back later or contact the meeting administrator if you believe this is an error.
              </p>
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Return to Home
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting</TableHead>
                  <TableHead className="hidden md:table-cell">Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{meeting.title}</p>
                        <p className="text-sm text-gray-500 truncate max-w-[250px]">{meeting.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{meeting.project_title}</TableCell>
                    <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                    <TableCell className="text-right">
                      {meeting.status === 'live' ? (
                        <Button
                          className="bg-evoting-600 hover:bg-evoting-700"
                          size="sm"
                          onClick={() => navigate(`/voter/meeting/${meeting.project_id}/${meeting.id}`)}
                        >
                          <Vote className="mr-2 h-4 w-4" />
                          Vote
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/voter/meeting/${meeting.project_id}/${meeting.id}`)}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default VoterDashboard;
