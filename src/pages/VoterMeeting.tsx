
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FileText, ArrowLeft, Check, X, Vote, AlertTriangle } from 'lucide-react';
import { TableVotingStatus } from '@/components/ui/table';
import { format } from 'date-fns';
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AgendaItem = {
  id: string;
  title: string;
  description: string | null;
  file_path?: string | null;
  file_name?: string | null;
  required_approval: number;
  votes?: {
    approved: number;
    disapproved: number;
    abstained: number;
  };
  userVote?: string | null;
};

type Meeting = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  end_date: string | null;
  project_id: string;
};

type Project = {
  id: string;
  title: string;
};

const VoterMeeting = () => {
  const { projectId, agendaId } = useParams<{ projectId: string; agendaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [voter, setVoter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/voter-login');
      return;
    }

    if (projectId && agendaId) {
      fetchData();
    }
  }, [projectId, agendaId, user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get voter information
      const { data: voterData, error: voterError } = await supabase
        .from('voters')
        .select('*')
        .eq('project_id', projectId)
        .eq('email', user?.email?.toLowerCase());

      if (voterError) throw voterError;

      if (!voterData || voterData.length === 0) {
        toast.error("You don't have permission to access this meeting");
        navigate('/voter-dashboard');
        return;
      }

      setVoter(voterData[0]);

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch meeting (agenda)
      const { data: agendaData, error: agendaError } = await supabase
        .from('agendas')
        .select('*')
        .eq('id', agendaId)
        .single();

      if (agendaError) throw agendaError;
      setMeeting(agendaData);

      // Fetch agenda items
      const { data: optionsData, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .eq('agenda_id', agendaId);

      if (optionsError) throw optionsError;

      // Fetch votes for this voter
      const { data: existingVotes, error: votesError } = await supabase
        .from('votes')
        .select('option_id, value')
        .eq('agenda_id', agendaId)
        .eq('voter_id', voterData[0].id);

      if (votesError) throw votesError;

      // Create a map of option_id to vote value
      const voteMap: Record<string, string> = {};
      existingVotes?.forEach(vote => {
        voteMap[vote.option_id] = vote.value;
      });

      // Set initial votes state
      setVotes(voteMap);

      // Fetch votes statistics for each agenda item
      const { data: voteStats, error: statsError } = await supabase
        .from('votes')
        .select('option_id, value, voting_weight')
        .eq('agenda_id', agendaId);

      if (statsError) throw statsError;

      // Process vote statistics
      const votingStats: Record<string, { approved: number, disapproved: number, abstained: number }> = {};
      voteStats?.forEach(vote => {
        if (!votingStats[vote.option_id]) {
          votingStats[vote.option_id] = { approved: 0, disapproved: 0, abstained: 0 };
        }
        
        const weight = vote.voting_weight || 1;
        
        if (vote.value === 'approve') {
          votingStats[vote.option_id].approved += weight;
        } else if (vote.value === 'disapprove') {
          votingStats[vote.option_id].disapproved += weight;
        } else if (vote.value === 'abstain') {
          votingStats[vote.option_id].abstained += weight;
        }
      });

      // Map agenda items with vote information
      const processedAgendaItems = optionsData?.map(item => ({
        ...item,
        votes: votingStats[item.id] || { approved: 0, disapproved: 0, abstained: 0 },
        userVote: voteMap[item.id] || null
      }));

      setAgendaItems(processedAgendaItems || []);
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      toast.error("Failed to load meeting details");
    } finally {
      setLoading(false);
    }
  };

  const handleVoteChange = (itemId: string, value: string) => {
    setVotes(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('voting-documents')
        .download(filePath);
      
      if (error) throw error;
      
      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (error: any) {
      console.error("Error downloading file:", error.message);
      toast.error("Failed to download file");
    }
  };

  const handleOpenSubmitDialog = () => {
    // Check if all items have a vote
    const unvotedItems = agendaItems.filter(item => !votes[item.id]);
    
    if (unvotedItems.length > 0) {
      toast.error("Please vote on all agenda items before submitting");
      return;
    }
    
    setIsSubmitDialogOpen(true);
  };

  const handleSubmitVotes = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare votes data
      const votesToSubmit = Object.entries(votes).map(([optionId, value]) => ({
        agenda_id: agendaId,
        option_id: optionId,
        voter_id: voter.id,
        value: value,
        voting_weight: voter.voting_weight || 1
      }));
      
      // Delete any existing votes first
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('voter_id', voter.id)
        .eq('agenda_id', agendaId);
        
      if (deleteError) throw deleteError;
      
      // Insert new votes
      const { error: insertError } = await supabase
        .from('votes')
        .insert(votesToSubmit);
        
      if (insertError) throw insertError;
      
      // Update voter status to voted
      const { error: updateError } = await supabase
        .from('voters')
        .update({ status: 'voted' })
        .eq('id', voter.id);
        
      if (updateError) throw updateError;
      
      toast.success("Your votes have been submitted successfully");
      setIsSubmitDialogOpen(false);
      
      // Refresh the data to get updated vote counts
      fetchData();
      
    } catch (error: any) {
      console.error("Error submitting votes:", error.message);
      toast.error("Failed to submit your votes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
      </div>
    );
  }

  if (!meeting || !project) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto p-4 text-center">
          <h1 className="text-2xl font-bold text-red-600">Meeting Not Found</h1>
          <p className="mt-2">The meeting you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button className="mt-4" onClick={() => navigate('/voter-dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const canVote = meeting.status === 'live';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{meeting.title}</h1>
              <p className="text-gray-600">{project.title}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/voter-dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Meeting Information</CardTitle>
              <Badge 
                className={
                  meeting.status === 'live' ? 'bg-green-500' : 
                  meeting.status === 'closed' ? 'bg-gray-500' : ''
                }
              >
                {meeting.status === 'live' ? 'Voting Open' : 
                 meeting.status === 'closed' ? 'Voting Closed' : 
                 'Draft'}
              </Badge>
            </div>
            <CardDescription>
              {meeting.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {meeting.end_date && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                  <p className="mt-1">{formatDate(meeting.end_date)}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Your Voting Weight</h3>
                <p className="mt-1">{voter?.voting_weight || 1}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Agenda Items</h2>
            {canVote && (
              <Button 
                className="bg-evoting-600 hover:bg-evoting-700"
                onClick={handleOpenSubmitDialog}
              >
                <Vote className="mr-2 h-4 w-4" />
                Submit Votes
              </Button>
            )}
          </div>
          
          {agendaItems.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No agenda items have been added to this meeting.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agendaItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{item.title}</CardTitle>
                      <div className="text-sm text-gray-500">
                        Required Approval: {item.required_approval}%
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-gray-500">
                        <div>Approved: {item.votes?.approved || 0}%</div>
                        <div>Against: {item.votes?.disapproved || 0}%</div>
                        <div>Abstained: {item.votes?.abstained || 0}%</div>
                      </div>
                      
                      <TableVotingStatus
                        approved={item.votes?.approved || 0}
                        disapproved={item.votes?.disapproved || 0}
                        abstained={item.votes?.abstained || 0}
                        requiredApproval={item.required_approval || 50}
                        className="mb-3"
                      />
                    </div>
                    
                    <div>
                      <p className="mb-4">{item.description || "No description provided."}</p>
                      
                      {item.file_path && item.file_name && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDownloadFile(item.file_path!, item.file_name!)}
                          className="flex items-center gap-2 mb-4"
                        >
                          <FileText className="h-4 w-4" />
                          Download Document
                        </Button>
                      )}
                      
                      {canVote ? (
                        <div className="mt-4 border-t pt-4">
                          <div className="font-medium mb-2">Your Vote:</div>
                          <RadioGroup 
                            value={votes[item.id] || ''} 
                            onValueChange={(value) => handleVoteChange(item.id, value)}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="approve" id={`approve-${item.id}`} />
                              <Label 
                                htmlFor={`approve-${item.id}`}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                                Approve
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="disapprove" id={`disapprove-${item.id}`} />
                              <Label 
                                htmlFor={`disapprove-${item.id}`}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <X className="h-4 w-4 text-red-500" />
                                Disapprove
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="abstain" id={`abstain-${item.id}`} />
                              <Label 
                                htmlFor={`abstain-${item.id}`}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                Abstain
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      ) : item.userVote ? (
                        <div className="mt-4 border-t pt-4">
                          <div className="font-medium mb-2">Your Vote:</div>
                          <Badge 
                            variant={
                              item.userVote === 'approve' ? 'success' : 
                              item.userVote === 'disapprove' ? 'destructive' : 'secondary'
                            }
                            className={
                              item.userVote === 'approve' ? 'bg-green-500' : 
                              item.userVote === 'disapprove' ? 'bg-red-500' : ''
                            }
                          >
                            {item.userVote === 'approve' ? 'Approved' : 
                             item.userVote === 'disapprove' ? 'Disapproved' : 'Abstained'}
                          </Badge>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Your Votes</DialogTitle>
            <DialogDescription>
              You're about to submit your votes for this meeting. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-sm">
                Once submitted, you won't be able to change your votes.
              </p>
            </div>
            <div className="space-y-2">
              {agendaItems.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span className="truncate max-w-[60%]">{item.title}</span>
                  <Badge 
                    variant={
                      votes[item.id] === 'approve' ? 'success' : 
                      votes[item.id] === 'disapprove' ? 'destructive' : 'secondary'
                    }
                    className={
                      votes[item.id] === 'approve' ? 'bg-green-500' : 
                      votes[item.id] === 'disapprove' ? 'bg-red-500' : ''
                    }
                  >
                    {votes[item.id] === 'approve' ? 'Approve' : 
                     votes[item.id] === 'disapprove' ? 'Disapprove' : 'Abstain'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitVotes} 
              disabled={isSubmitting}
              className="bg-evoting-600 hover:bg-evoting-700"
            >
              {isSubmitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoterMeeting;
