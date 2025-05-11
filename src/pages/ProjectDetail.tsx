
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Navigation from "@/components/layout/Navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  admin_id: string;
};

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

// Form schema for creating a new agenda/meeting
const agendaFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

// Form schema for updating project status
const projectStatusFormSchema = z.object({
  status: z.string().min(1, "Status is required"),
});

type AgendaFormValues = z.infer<typeof agendaFormSchema>;
type ProjectStatusValues = z.infer<typeof projectStatusFormSchema>;

const VotingSummary = ({ projectId }: { projectId: string }) => {
  const [votingStats, setVotingStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchVotingStats = async () => {
      try {
        const { data, error } = await supabase
          .from('agendas')
          .select('*') // Make sure we select all fields including end_date
          .eq('project_id', projectId);
        
        if (error) throw error;

        const currentDate = new Date();
        
        const stats = {
          total: data?.length || 0,
          active: data?.filter(a => {
            if (a.status === 'active' && a.end_date) {
              return new Date(a.end_date) > currentDate;
            }
            return false;
          }).length || 0,
          completed: data?.filter(a => {
            if (a.status === 'completed' || (a.end_date && new Date(a.end_date) < currentDate)) {
              return true;
            }
            return false;
          }).length || 0
        };
        
        setVotingStats(stats);
      } catch (error: any) {
        console.error("Error fetching voting stats:", error.message);
      }
    };

    fetchVotingStats();
  }, [projectId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Votings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{votingStats.total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Live Votings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">{votingStats.active}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Completed Votings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">{votingStats.completed}</p>
        </CardContent>
      </Card>
    </div>
  );
};

const AgendaCard = ({ agenda }: { agenda: Agenda }) => {
  const isActive = agenda.status === 'live';
  const isClosed = agenda.status === 'closed';

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMM d, yyyy - h:mm a');
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${
      isActive ? 'border-green-400 border-2' : 
      isClosed ? 'bg-gray-50' : ''
    }`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className={`text-xl ${
            isActive ? 'text-green-700' : 
            isClosed ? 'text-gray-700' : ''
          }`}>
            {agenda.title}
          </CardTitle>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isActive ? 'bg-green-100 text-green-800' : 
            isClosed ? 'bg-gray-100 text-gray-800' : 
            'bg-yellow-100 text-yellow-800'
          }`}>
            {isActive ? 'Live' : isClosed ? 'Closed' : 'Draft'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className={`mb-3 ${!isActive ? 'text-gray-500' : 'text-gray-700'}`}>
          {agenda.description || "No description"}
        </p>
        
        <div className="space-y-2">
          {(agenda.start_date || agenda.end_date) && (
            <>
              {agenda.start_date && (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-700 font-medium">Start:</span>
                  <span className="ml-2 text-gray-600">{formatDateTime(agenda.start_date)}</span>
                </div>
              )}
              
              {agenda.end_date && (
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-700 font-medium">End:</span>
                  <span className="ml-2 text-gray-600">{formatDateTime(agenda.end_date)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
      <div className="px-6 py-4 border-t">
        <Button asChild variant="outline" className="w-full">
          <Link to={`/projects/${agenda.project_id}/agenda/${agenda.id}`}>
            View Voting Details
          </Link>
        </Button>
      </div>
    </Card>
  );
};

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(agendaFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });
  
  const statusForm = useForm<ProjectStatusValues>({
    resolver: zodResolver(projectStatusFormSchema),
    defaultValues: {
      status: "",
    },
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchAgendas();
    }
  }, [projectId]);
  
  useEffect(() => {
    if (project) {
      statusForm.setValue("status", project.status);
    }
  }, [project, statusForm]);

  const fetchProject = async () => {
    try {
      if (!projectId) return;
      
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
      console.error("Error fetching project details:", error.message);
      toast.error("Failed to load project details");
      navigate('/projects');
    }
  };

  const fetchAgendas = async () => {
    try {
      setLoading(true);
      if (!projectId) return;

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
      toast.error("Failed to load voting agendas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgenda = async (values: AgendaFormValues) => {
    try {
      if (!user || !projectId) {
        toast.error("You must be logged in to create a voting agenda");
        return;
      }

      const { data, error } = await supabase
        .from('agendas')
        .insert([
          { 
            title: values.title,
            description: values.description || null,
            project_id: projectId,
            status: 'draft', // Ensure default status is 'draft' 
            voting_type: 'single_choice'
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast.success("Voting created successfully!");
      setCreateDialogOpen(false);
      form.reset();
      fetchAgendas();
    } catch (error: any) {
      console.error("Error creating agenda:", error.message);
      toast.error(error.message || "Failed to create voting");
    }
  };
  
  const handleUpdateStatus = async (values: ProjectStatusValues) => {
    try {
      if (!projectId) return;
      
      const { error } = await supabase
        .from('projects')
        .update({ status: values.status })
        .eq('id', projectId);
        
      if (error) throw error;
      
      toast.success(`Project status updated to ${values.status}`);
      fetchProject();
      setStatusDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating project status:", error.message);
      toast.error(error.message || "Failed to update project status");
    }
  };
  
  const filteredAgendas = agendas.filter(agenda => 
    agenda.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agenda.description && agenda.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!project && !loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Project Not Found</h1>
        <p className="mt-2">The project you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button className="mt-4" asChild>
          <Link to="/projects">Back to Projects</Link>
        </Button>
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
              <BreadcrumbPage>{project?.title || "Project Details"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {loading && !project ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{project?.title}</h1>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    project?.status === 'active' ? 'bg-green-100 text-green-800' :
                    project?.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {project?.status.charAt(0).toUpperCase() + project?.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{project?.description || "No description provided."}</p>
                
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-sm text-gray-500">
                    Created on {new Date(project?.created_at || "").toLocaleDateString()}
                  </p>
                  
                  {profile && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium capitalize">
                      {profile.role.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStatusDialogOpen(true)}
                >
                  Update Status
                </Button>
                
                <Button 
                  className="bg-evoting-600 hover:bg-evoting-700 text-white"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> New Voting
                </Button>
              </div>
            </div>
            
            <VotingSummary projectId={projectId || ""} />
            
            <div className="mb-8 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                className="pl-10"
                placeholder="Search votings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
              </div>
            ) : filteredAgendas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAgendas.map((agenda) => (
                  <AgendaCard key={agenda.id} agenda={agenda} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No votings found for this project.</p>
                <Button 
                  className="bg-evoting-600 hover:bg-evoting-700 text-white"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Create your first voting
                </Button>
              </div>
            )}

            {/* Create Agenda Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Voting</DialogTitle>
                  <DialogDescription>
                    Set up a new voting session for this project.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateAgenda)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voting Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter voting title..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter voting description..." 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-evoting-600 hover:bg-evoting-700 text-white">
                        Create Voting
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Update Project Status Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Update Project Status</DialogTitle>
                  <DialogDescription>
                    Change the current status of this project.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...statusForm}>
                  <form onSubmit={statusForm.handleSubmit(handleUpdateStatus)} className="space-y-4">
                    <FormField
                      control={statusForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-evoting-600 hover:bg-evoting-700 text-white">
                        Update Status
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
