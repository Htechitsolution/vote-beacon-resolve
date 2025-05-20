
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Navigation from "@/components/layout/Navigation";

interface Voter {
  id: string;
  email: string;
  name?: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
}

const VoterMeetingList = () => {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [selectedVoterId, setSelectedVoterId] = useState<string | null>(null);
  const [voterMeetings, setVoterMeetings] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Check if user is a super admin
  useEffect(() => {
    if (profile && profile.role !== 'super_admin') {
      toast.error("You do not have permission to access this page");
      navigate('/projects');
    }
  }, [profile, navigate]);

  // Fetch all voters
  useEffect(() => {
    const fetchAllVoters = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('voters')
          .select('id, email, name')
          .order('email');

        if (error) throw error;
        setVoters(data || []);
      } catch (error: any) {
        console.error("Error fetching voters:", error);
        toast.error("Failed to load voters");
      } finally {
        setLoading(false);
      }
    };

    fetchAllVoters();
  }, []);

  // Fetch meetings for selected voter
  useEffect(() => {
    if (!selectedVoterId) return;

    const fetchVoterMeetings = async () => {
      try {
        setLoadingMeetings(true);
        
        // Get projects associated with this voter
        const { data, error } = await supabase
          .from('voters')
          .select('project_id')
          .eq('id', selectedVoterId);

        if (error) throw error;
        
        if (!data || data.length === 0) {
          setVoterMeetings([]);
          return;
        }

        // Get the details of these projects
        const projectIds = data.map(item => item.project_id);
        
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        
        setVoterMeetings(projectsData || []);
        
      } catch (error: any) {
        console.error("Error fetching voter meetings:", error);
        toast.error("Failed to load meetings for this voter");
      } finally {
        setLoadingMeetings(false);
      }
    };

    fetchVoterMeetings();
  }, [selectedVoterId]);

  const handleVoterChange = (voterId: string) => {
    setSelectedVoterId(voterId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Voter Meeting List</h1>

        {/* Voter selection dropdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Voter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full md:w-1/2">
              <Select
                onValueChange={handleVoterChange}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a voter" />
                </SelectTrigger>
                <SelectContent>
                  {voters.map((voter) => (
                    <SelectItem key={voter.id} value={voter.id}>
                      {voter.email} {voter.name ? `(${voter.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loading && (
                <p className="text-sm text-gray-500 mt-2">Loading voters...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Meeting list */}
        <Card>
          <CardHeader>
            <CardTitle>Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedVoterId ? (
              loadingMeetings ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading meetings...</p>
                </div>
              ) : voterMeetings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voterMeetings.map((meeting) => (
                        <TableRow key={meeting.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/projects/${meeting.id}`)}>
                          <TableCell className="font-medium">{meeting.title}</TableCell>
                          <TableCell>{meeting.description || '-'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              meeting.status === 'live' 
                                ? 'bg-green-100 text-green-800' 
                                : meeting.status === 'completed' 
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                              {formatDate(meeting.created_at)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No meetings found for this voter.</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Please select a voter to view their meetings.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoterMeetingList;
