
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Users, CreditCard, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import Navigation from "@/components/layout/Navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  created_at: string;
  title: string;
  description: string;
}

interface Agenda {
  id: string;
  created_at: string;
  title: string;
  description: string;
  project_id: string;
  status: string;
}

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isCreateAgendaDialogOpen, setIsCreateAgendaDialogOpen] = useState(false);
  const [newAgendaTitle, setNewAgendaTitle] = useState("");
  const [newAgendaDescription, setNewAgendaDescription] = useState("");
  const [availableCredits, setAvailableCredits] = useState(0);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!projectId) {
      console.error("Project ID is missing");
      return;
    }

    fetchProject(projectId);
    fetchAgendas(projectId);
    fetchUserCredits();
  }, [projectId, user?.id]);

  const fetchUserCredits = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Set credits (default to 0 if not available)
      setAvailableCredits(data?.credits || 0);
    } catch (error: any) {
      console.error("Error fetching user credits:", error.message);
    }
  };

  const fetchProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        throw error;
      }

      setProject(data);
    } catch (error: any) {
      console.error("Error fetching project:", error.message);
      toast("Error", {
        description: "Failed to load project", 
        variant: "destructive"
      });
    }
  };

  const fetchAgendas = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAgendas(data || []);
    } catch (error: any) {
      console.error("Error fetching agendas:", error.message);
      toast("Error", {
        description: "Failed to load agendas",
        variant: "destructive"
      });
    }
  };

  const handleCreateAgendaClick = () => {
    if (availableCredits <= 0) {
      toast("Insufficient Credits", {
        description: "You need at least 1 credit to create a new meeting. Please purchase more credits.",
        variant: "destructive"
      });
      return;
    }
    setIsCreateAgendaDialogOpen(true);
  };

  const handleCloseCreateAgendaDialog = () => {
    setIsCreateAgendaDialogOpen(false);
    setNewAgendaTitle("");
    setNewAgendaDescription("");
  };

  const handleCreateAgenda = async () => {
    try {
      if (!newAgendaTitle || !newAgendaDescription) {
        toast("Error", {
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }

      if (!projectId) {
        toast("Error", {
          description: "Project ID is missing",
          variant: "destructive"
        });
        return;
      }

      if (availableCredits <= 0) {
        toast("Insufficient Credits", {
          description: "You need at least 1 credit to create a new meeting",
          variant: "destructive"
        });
        return;
      }

      // First, deduct 1 credit from user's account
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ 
          credits: availableCredits - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (creditError) throw creditError;

      // Then create the agenda
      const { data, error } = await supabase
        .from('agendas')
        .insert([
          {
            title: newAgendaTitle,
            description: newAgendaDescription,
            project_id: projectId,
            status: 'draft'
          },
        ])
        .select('*');

      if (error) {
        throw error;
      }

      setAgendas([...agendas, ...(data || [])]);
      handleCloseCreateAgendaDialog();
      
      // Update local credit count
      setAvailableCredits(availableCredits - 1);
      
      toast("Success", {
        description: "Meeting created successfully! 1 credit has been deducted from your account."
      });
    } catch (error: any) {
      console.error("Error creating agenda:", error.message);
      toast("Error", {
        description: "Failed to create meeting: " + error.message,
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (error) {
      return dateString.split('T')[0] || 'Unknown';
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
    <div>
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>
                <Link to="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project?.title || 'Project Details'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{project?.title || 'Loading...'}</h1>
            <p className="text-gray-600 mt-1">{project?.description || 'No description'}</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Card className="border border-amber-200 bg-amber-50">
              <CardContent className="py-3 px-4 flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-amber-600" />
                <span className="text-amber-800 font-medium">{availableCredits} Credits Available</span>
              </CardContent>
            </Card>
            
          
            
            <Button
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
              onClick={handleCreateAgendaClick}
              disabled={availableCredits <= 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Meeting
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${projectId}/voters`)}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Voters
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          {agendas.map((agenda) => (
            <Card key={agenda.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-xl">{agenda.title}</h3>
                    {getStatusBadge(agenda.status || 'draft')}
                  </div>
                  <p className="text-gray-600 mb-3">{agenda.description}</p>
                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-3">
                    <span className="flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      Created: {formatDate(agenda.created_at)}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 flex items-center justify-center md:border-l border-gray-100">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/projects/${projectId}/agenda/${agenda.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {agendas.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <h3 className="text-xl font-medium text-gray-600 mb-2">No meetings found</h3>
              <p className="text-gray-500 mb-6">Create your first meeting to get started</p>
              <Button 
                className="bg-evoting-600 hover:bg-evoting-700 text-white"
                onClick={handleCreateAgendaClick}
                disabled={availableCredits <= 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Meeting
              </Button>
              {availableCredits <= 0 && (
                <p className="text-red-500 mt-3">
                  You need credits to create meetings. 
                  <Button
                    variant="link"
                    className="text-evoting-600 p-0 h-auto"
                    onClick={() => navigate('/checkout')}
                  >
                    Buy credits now
                  </Button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Create Meeting Dialog Modal */}
      {isCreateAgendaDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Meeting</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="agendaTitle">Title</Label>
                <Input
                  type="text"
                  id="agendaTitle"
                  placeholder="Enter meeting title"
                  value={newAgendaTitle}
                  onChange={(e) => setNewAgendaTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="agendaDescription">Description</Label>
                <Textarea
                  id="agendaDescription"
                  placeholder="Enter meeting description"
                  value={newAgendaDescription}
                  onChange={(e) => setNewAgendaDescription(e.target.value)}
                />
              </div>
              
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Creating this meeting will use 1 credit from your account.
                  You currently have {availableCredits} credits available.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-4">
              <Button variant="ghost" onClick={handleCloseCreateAgendaDialog}>
                Cancel
              </Button>
              <Button 
                className="bg-evoting-600 hover:bg-evoting-700 text-white" 
                onClick={handleCreateAgenda}
                disabled={availableCredits <= 0}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
