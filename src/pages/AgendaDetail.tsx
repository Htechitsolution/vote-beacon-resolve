
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  ArrowLeft, 
  Users, 
  Vote, 
  Check, 
  Clock, 
  ChartBar, 
  X, 
  Calendar,
  Upload,
  AlertTriangle,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Navigation from "@/components/layout/Navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableVotingStatus
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type Agenda = {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  voting_type: string;
  created_at: string;
  required_approval?: number | null;
};

type Project = {
  id: string;
  title: string;
  status: string;
};

type AgendaItem = {
  id: string;
  title: string;
  description: string | null;
  agenda_id: string;
  file_path?: string | null;
  file_name?: string | null;
  required_approval?: number | null;
  votes?: {
    approved: number;
    disapproved: number;
    abstained: number;
  };
};

type Voter = {
  id: string;
  name: string;
  email: string;
  company_name?: string | null;
  voting_weight: number;
  status: string;
  voted_on?: string[];
  vote_values?: Record<string, string>;
};

const AgendaDetail = () => {
  const { projectId, agendaId } = useParams<{ projectId: string; agendaId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [isAdmin, setIsAdmin] = useState(false);

  // New state variables for dialogs and forms
  const [isAddAgendaItemDialogOpen, setIsAddAgendaItemDialogOpen] = useState(false);
  const [newAgendaTitle, setNewAgendaTitle] = useState("");
  const [newAgendaDescription, setNewAgendaDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStartVotingDialogOpen, setIsStartVotingDialogOpen] = useState(false);
  const [isExtendEndDateDialogOpen, setIsExtendEndDateDialogOpen] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [requiredApproval, setRequiredApproval] = useState<number>(50);
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<string | null>(null);
  const [voterVotes, setVoterVotes] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    if (projectId && agendaId) {
      fetchData();
    }
  }, [projectId, agendaId]);

  useEffect(() => {
    if (profile) {
      setIsAdmin(profile.role === 'admin' || profile.role === 'super_admin');
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, title, status')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch agenda
      const { data: agendaData, error: agendaError } = await supabase
        .from('agendas')
        .select('*')
        .eq('id', agendaId)
        .single();

      if (agendaError) throw agendaError;
      setAgenda(agendaData);

      // Fetch agenda items (previously options)
      const { data: agendaItemsData, error: agendaItemsError } = await supabase
        .from('options')
        .select('*')
        .eq('agenda_id', agendaId);

      if (agendaItemsError) throw agendaItemsError;
      
      // Fetch votes to calculate statistics for each agenda item
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('agenda_id', agendaId);
        
      if (votesError) throw votesError;
      
      // Process votes data to organize by voter and agenda item
      const votesByVoter: Record<string, Record<string, string>> = {};
      const votesByAgendaItem: Record<string, { approved: number, disapproved: number, abstained: number }> = {};
      
      votesData?.forEach(vote => {
        // Group votes by voter
        if (!votesByVoter[vote.voter_id]) {
          votesByVoter[vote.voter_id] = {};
        }
        votesByVoter[vote.voter_id][vote.option_id] = vote.value || 'approve';
        
        // Count votes by agenda item
        if (!votesByAgendaItem[vote.option_id]) {
          votesByAgendaItem[vote.option_id] = { approved: 0, disapproved: 0, abstained: 0 };
        }
        
        const weight = vote.voting_weight || 1;
        
        if (vote.value === 'approve') {
          votesByAgendaItem[vote.option_id].approved += weight;
        } else if (vote.value === 'disapprove') {
          votesByAgendaItem[vote.option_id].disapproved += weight;
        } else if (vote.value === 'abstain') {
          votesByAgendaItem[vote.option_id].abstained += weight;
        }
      });
      
      setVoterVotes(votesByVoter);
      
      // Map vote statistics to agenda items
      const processedAgendaItems = agendaItemsData?.map(item => ({
        ...item,
        votes: votesByAgendaItem[item.id] || { approved: 0, disapproved: 0, abstained: 0 }
      })) || [];
      
      setAgendaItems(processedAgendaItems);

      // Fetch voters
      const { data: votersData, error: votersError } = await supabase
        .from('voters')
        .select('*')
        .eq('project_id', projectId);

      if (votersError) throw votersError;
      
      // Add voting status to each voter
      const processedVoters = votersData?.map(voter => {
        const voterVoteData = votesByVoter[voter.id] || {};
        return {
          ...voter,
          voted_on: Object.keys(voterVoteData),
          vote_values: voterVoteData
        };
      }) || [];
      
      setVoters(processedVoters);
      
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      toast.error("Failed to load agenda details");
    } finally {
      setLoading(false);
    }
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

  const handleStartVoting = () => {
    setIsStartVotingDialogOpen(true);
  };

  const confirmStartVoting = async () => {
    try {
      if (!selectedEndDate) {
        toast.error("Please select an end date");
        return;
      }
      
      const { error } = await supabase
        .from('agendas')
        .update({ 
          status: 'live', 
          start_date: new Date().toISOString(),
          end_date: selectedEndDate.toISOString()
        })
        .eq('id', agendaId);
        
      if (error) throw error;
      
      toast.success("Voting has been started");
      setIsStartVotingDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error starting voting:", error.message);
      toast.error("Failed to start voting");
    }
  };

  const handleExtendEndDate = () => {
    setIsExtendEndDateDialogOpen(true);
  };

  const confirmExtendEndDate = async () => {
    try {
      if (!selectedEndDate) {
        toast.error("Please select a new end date");
        return;
      }
      
      const { error } = await supabase
        .from('agendas')
        .update({ end_date: selectedEndDate.toISOString() })
        .eq('id', agendaId);
        
      if (error) throw error;
      
      toast.success("End date has been extended");
      setIsExtendEndDateDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error extending end date:", error.message);
      toast.error("Failed to extend end date");
    }
  };

  const handleCloseVoting = async () => {
    try {
      const { error } = await supabase
        .from('agendas')
        .update({ status: 'closed', end_date: new Date().toISOString() })
        .eq('id', agendaId);
        
      if (error) throw error;
      
      toast.success("Voting has been closed");
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error closing voting:", error.message);
      toast.error("Failed to close voting");
    }
  };

  const handleAddAgendaItem = () => {
    setIsAddAgendaItemDialogOpen(true);
    setNewAgendaTitle("");
    setNewAgendaDescription("");
    setSelectedFile(null);
    setRequiredApproval(50); // Default to 50%
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size cannot exceed 5MB");
        return;
      }
      
      // Check file type
      const allowedTypes = [
        'application/pdf', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, Word, Excel, PowerPoint, or ZIP files are allowed");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmitAgendaItem = async () => {
    try {
      setIsUploading(true);
      
      if (!newAgendaTitle) {
        toast.error("Agenda title is required");
        setIsUploading(false);
        return;
      }
      
      let filePath = null;
      let fileName = null;
      
      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileKey = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const storagePath = `options/${fileKey}`;
        
        const { error: uploadError } = await supabase.storage
          .from('voting-documents')
          .upload(storagePath, selectedFile);
        
        if (uploadError) throw uploadError;
        
        filePath = storagePath;
        fileName = selectedFile.name;
      }
      
      // Insert new agenda item with required approval percentage
      const { data, error } = await supabase
        .from('options')
        .insert([
          {
            title: newAgendaTitle,
            description: newAgendaDescription,
            agenda_id: agendaId,
            file_path: filePath,
            file_name: fileName,
            required_approval: requiredApproval
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Update agendaItems state
      const newItem = {
        ...data[0],
        votes: { approved: 0, disapproved: 0, abstained: 0 }
      };
      
      setAgendaItems([...agendaItems, newItem]);
      
      setIsAddAgendaItemDialogOpen(false);
      toast.success("Agenda item added successfully");
    } catch (error: any) {
      console.error("Error adding agenda item:", error.message);
      toast.error("Failed to add agenda item");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleViewAgendaItem = (id: string) => {
    setSelectedAgendaItem(id === selectedAgendaItem ? null : id);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      return dateString;
    }
  };

  // Set proper status badges based on agenda state
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="success" className="capitalize">Live</Badge>;
      case 'closed':
        return <Badge variant="default" className="capitalize">Closed</Badge>;
      default: // 'draft' or any other status
        return <Badge variant="outline" className="capitalize">Draft</Badge>;
    }
  };

  // Auto-close voting when end date is reached
  useEffect(() => {
    if (agenda?.status === 'live' && agenda?.end_date) {
      const endDate = new Date(agenda.end_date);
      const now = new Date();
      
      if (now > endDate) {
        handleCloseVoting();
      } else {
        // Set timeout to close voting automatically
        const timeUntilClose = endDate.getTime() - now.getTime();
        if (timeUntilClose < 2147483647) { // Max setTimeout value (~24.8 days)
          const timer = setTimeout(() => {
            handleCloseVoting();
          }, timeUntilClose);
          
          // Clean up timer
          return () => clearTimeout(timer);
        }
      }
    }
  }, [agenda]);

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!agenda || !project) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Agenda Not Found</h1>
          <p className="mt-2">The agenda you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button className="mt-4" asChild>
            <Link to={`/projects/${projectId}`}>Back to Meeting</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link to="/">Home</Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link to="/projects">Projects</Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link to={`/projects/${projectId}`}>{project?.title}</Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{agenda?.title}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{agenda?.title}</h1>
              <p className="text-gray-600 mb-2">{agenda?.description}</p>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                {isAdmin && agenda.status === 'draft' && (
                  <Button 
                    onClick={handleStartVoting} 
                    className="bg-evoting-600 hover:bg-evoting-700 text-white"
                  >
                    <Vote className="mr-2 h-4 w-4" />
                    Start Voting
                  </Button>
                )}
                
                {isAdmin && agenda.status === 'live' && (
                  <>
                    <Button 
                      onClick={handleExtendEndDate}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Extend End Date
                    </Button>
                    
                    <Button 
                      onClick={handleCloseVoting}
                      variant="destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Close Meeting
                    </Button>
                  </>
                )}
                
                <Button 
                  asChild 
                  variant={agenda.status !== 'draft' ? "default" : "outline"}
                >
                  <Link to={`/projects/${projectId}/agenda/${agendaId}/results`}>
                    <ChartBar className="mr-2 h-4 w-4" />
                    View Results
                  </Link>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate(`/projects/${projectId}/voters`)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Voters
                </Button>
                
                <div className="hidden sm:flex items-center">
                  {getStatusBadge(agenda.status)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild>
                <Link to={`/projects/${projectId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Meeting
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="voters">Voting Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Agenda Information</CardTitle>
                {isAdmin && agenda.status === 'draft' && (
                  <Button onClick={handleAddAgendaItem} className="bg-evoting-600 hover:bg-evoting-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Agenda
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="mt-1">{getStatusBadge(agenda.status)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Voting Type</h3>
                    <p className="mt-1 capitalize">{agenda.voting_type || "Standard"}</p>
                  </div>
                  {agenda.status !== 'draft' && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                        <p className="mt-1">{formatDate(agenda.end_date)}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {/* List of agenda items */}
                {agendaItems.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">No agenda items have been added yet.</p>
                    {isAdmin && agenda.status === 'draft' && (
                      <Button onClick={handleAddAgendaItem} variant="outline" className="mt-4">
                        Add Your First Agenda Item
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agendaItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            <div className="text-sm text-gray-500">
                              Required Approval: {item.required_approval || 50}%
                            </div>
                          </div>
                        </CardHeader>
                        
                        {/* Voting status bar */}
                        <CardContent className="pb-2">
                          {agenda.status !== 'draft' && (
                            <>
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
                            </>
                          )}
                          
                          <p className="text-gray-700 text-sm">{item.description || "No description provided."}</p>
                          
                          {item.file_path && item.file_name && (
                            <div className="mt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDownloadFile(item.file_path!, item.file_name!)}
                                className="flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4" />
                                Download Document
                              </Button>
                            </div>
                          )}
                        </CardContent>
                        
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleViewAgendaItem(item.id)}
                          className="w-full py-2"
                        >
                          {selectedAgendaItem === item.id ? "Hide Details" : "View Details"}
                        </Button>
                        
                        {/* Detailed voter list for this agenda item */}
                        {selectedAgendaItem === item.id && (
                          <CardContent className="bg-gray-50 border-t pt-4">
                            <h4 className="font-medium mb-3">Voting Details</h4>
                            {voters.length > 0 ? (
                              <div className="border rounded-md">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Company</TableHead>
                                      <TableHead>Weight</TableHead>
                                      <TableHead className="text-right">Vote</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {voters.map((voter) => {
                                      const hasVoted = voter.voted_on?.includes(item.id);
                                      const voteValue = voter.vote_values?.[item.id] || "Not voted";
                                      
                                      return (
                                        <TableRow key={voter.id}>
                                          <TableCell className="font-medium">{voter.name}</TableCell>
                                          <TableCell>{voter.company_name || "-"}</TableCell>
                                          <TableCell>{voter.voting_weight}</TableCell>
                                          <TableCell className="text-right">
                                            {hasVoted ? (
                                              <Badge variant={voteValue === 'approve' ? 'success' : 
                                                voteValue === 'disapprove' ? 'destructive' : 'secondary'}>
                                                {voteValue === 'approve' ? 'Approved' : 
                                                 voteValue === 'disapprove' ? 'Against' : 'Abstained'}
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline">Not Voted</Badge>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-2">No voters available.</p>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="voters">
            <Card>
              <CardHeader>
                <CardTitle>Voting Status</CardTitle>
              </CardHeader>
              <CardContent>
                {voters.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No voters have been registered yet.</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead className="text-right">Weight (%)</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {voters.map((voter) => (
                          <TableRow key={voter.id}>
                            <TableCell className="font-medium">{voter.name}</TableCell>
                            <TableCell>{voter.email}</TableCell>
                            <TableCell>{voter.company_name || "-"}</TableCell>
                            <TableCell className="text-right">{voter.voting_weight}</TableCell>
                            <TableCell className="text-right capitalize">{voter.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Agenda Item Dialog */}
      <Dialog open={isAddAgendaItemDialogOpen} onOpenChange={setIsAddAgendaItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Agenda</DialogTitle>
            <DialogDescription>
              Create a new agenda item with title, resolution and optional document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="Enter agenda title"
                value={newAgendaTitle}
                onChange={(e) => setNewAgendaTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Resolution</Label>
              <Textarea 
                id="description" 
                placeholder="Enter resolution text"
                value={newAgendaDescription}
                onChange={(e) => setNewAgendaDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requiredApproval">Required Approval Percentage (%)</Label>
              <Input 
                id="requiredApproval" 
                type="number"
                min="1"
                max="100"
                placeholder="50"
                value={requiredApproval}
                onChange={(e) => setRequiredApproval(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500">
                Percentage of votes required for approval (default: 50%)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Document (Optional - max 5MB)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="file" 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                />
              </div>
              <p className="text-xs text-gray-500">
                Accepted formats: PDF, Word, Excel, PowerPoint, ZIP (Max 5MB)
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              onClick={handleSubmitAgendaItem} 
              disabled={isUploading || !newAgendaTitle}
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
            >
              {isUploading ? "Uploading..." : "Add Agenda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Start Voting Confirmation Dialog */}
      <Dialog open={isStartVotingDialogOpen} onOpenChange={setIsStartVotingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Voting</DialogTitle>
            <DialogDescription>
              Please select when voting should end. Voting will start immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`justify-start text-left font-normal ${!selectedEndDate ? "text-muted-foreground" : ""}`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedEndDate ? format(selectedEndDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedEndDate}
                    onSelect={setSelectedEndDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Once voting has started, agenda items cannot be modified or deleted. 
                Voters will be notified and can start voting immediately.
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={confirmStartVoting} 
              disabled={!selectedEndDate}
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
            >
              Start Voting Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Extend End Date Dialog */}
      <Dialog open={isExtendEndDateDialogOpen} onOpenChange={setIsExtendEndDateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend End Date</DialogTitle>
            <DialogDescription>
              Please select a new end date for the voting period.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="endDate">New End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`justify-start text-left font-normal ${!selectedEndDate ? "text-muted-foreground" : ""}`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedEndDate ? format(selectedEndDate, "PPP") : "Select new end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedEndDate}
                    onSelect={setSelectedEndDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={confirmExtendEndDate} 
              disabled={!selectedEndDate}
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
            >
              Extend End Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaDetail;
