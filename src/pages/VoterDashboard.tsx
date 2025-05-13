
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Vote, LogOut } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

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
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/voter-login');
      return;
    }

    fetchMeetings();
  }, [user]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Get voter's email
      const email = user.email;
      
      if (!email) {
        toast.error('Unable to find voter information');
        return;
      }

      // Find projects where this voter is registered
      const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('project_id')
        .eq('email', email.toLowerCase());
      
      if (voterError) throw voterError;
      
      if (!voterData || voterData.length === 0) {
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
      toast.error('Failed to load your meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/voter-login');
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error.message);
      toast.error('Failed to log out');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="success" className="bg-green-500">Live</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-200">Closed</Badge>;
      default: // 'draft' or any other status
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Voter Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">{user?.email}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-evoting-600"></div>
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You do not have any meetings to participate in.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
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
                      <TableRow key={meeting.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{meeting.title}</p>
                            <p className="text-sm text-gray-500 truncate">{meeting.description}</p>
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
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VoterDashboard;
