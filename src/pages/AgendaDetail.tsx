import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ArrowLeft, Users, Vote, Check, Clock, ChartBar, X } from "lucide-react";
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
} from "@/components/ui/table";
import { format } from "date-fns";

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
};

type Project = {
  id: string;
  title: string;
  status: string;
};

type Option = {
  id: string;
  title: string;
  description: string | null;
  agenda_id: string;
  file_path?: string | null;
  file_name?: string | null;
};

type Voter = {
  id: string;
  name: string;
  email: string;
  company_name?: string | null;
  voting_weight: number;
  status: string;
};

const AgendaDetail = () => {
  const { projectId, agendaId } = useParams<{ projectId: string; agendaId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [isAdmin, setIsAdmin] = useState(false);

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

      // Fetch options
      const { data: optionsData, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .eq('agenda_id', agendaId);

      if (optionsError) throw optionsError;
      setOptions(optionsData || []);

      // Fetch voters
      const { data: votersData, error: votersError } = await supabase
        .from('voters')
        .select('*')
        .eq('project_id', projectId);

      if (votersError) throw votersError;
      setVoters(votersData || []);
      
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

  const handleStartVoting = async () => {
    try {
      const { error } = await supabase
        .from('agendas')
        .update({ status: 'live', start_date: new Date().toISOString() })
        .eq('id', agendaId);
        
      if (error) throw error;
      
      toast.success("Voting has been started");
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error starting voting:", error.message);
      toast.error("Failed to start voting");
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
            <Link to={`/projects/${projectId}`}>Back to Project</Link>
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
                  <Button 
                    onClick={handleCloseVoting}
                    variant="destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Close Meeting
                  </Button>
                )}
                
                <Button asChild variant={agenda.status !== 'draft' ? "default" : "outline"}>
                  <Link to={`/projects/${projectId}/agenda/${agendaId}/results`}>
                    <ChartBar className="mr-2 h-4 w-4" />
                    View Results
                  </Link>
                </Button>
                
                {/* Status badge only shown in small detail, not above title */}
                <div className="hidden sm:flex items-center">
                  {getStatusBadge(agenda.status)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild>
                <Link to={`/projects/${projectId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Project
                </Link>
              </Button>
              
              {isAdmin && (
                <Button variant="outline" asChild>
                  <Link to={`/projects/${projectId}/agenda/${agendaId}/voters`}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Voters
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="options">Voting Options</TabsTrigger>
            <TabsTrigger value="voters">Registered Voters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Agenda Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="mt-1">{getStatusBadge(agenda.status)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Voting Type</h3>
                    <p className="mt-1 capitalize">{agenda.voting_type || "Standard"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                    <p className="mt-1">{formatDate(agenda.start_date)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                    <p className="mt-1">{formatDate(agenda.end_date)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <p className="mt-1">{formatDate(agenda.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="options">
            <Card>
              <CardHeader>
                <CardTitle>Voting Options</CardTitle>
              </CardHeader>
              <CardContent>
                {options.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No voting options have been added yet.</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Option</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Document</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {options.map((option) => (
                          <TableRow key={option.id}>
                            <TableCell className="font-medium">{option.title}</TableCell>
                            <TableCell>{option.description || "-"}</TableCell>
                            <TableCell>
                              {option.file_path && option.file_name ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDownloadFile(option.file_path!, option.file_name!)}
                                  className="flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  Download
                                </Button>
                              ) : (
                                <span className="text-gray-400 text-sm">No document</span>
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
          </TabsContent>
          
          <TabsContent value="voters">
            <Card>
              <CardHeader>
                <CardTitle>Registered Voters</CardTitle>
              </CardHeader>
              <CardContent>
                {voters.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No voters have been registered yet.</p>
                    {isAdmin && (
                      <Button 
                        className="mt-4 bg-evoting-600 hover:bg-evoting-700 text-white"
                        asChild
                      >
                        <Link to={`/projects/${projectId}/agenda/${agendaId}/voters`}>
                          <Users className="mr-2 h-4 w-4" />
                          Manage Voters
                        </Link>
                      </Button>
                    )}
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
    </div>
  );
};

export default AgendaDetail;
