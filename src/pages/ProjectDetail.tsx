
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date({ required_error: "End date is required" }),
});

type AgendaFormValues = z.infer<typeof agendaFormSchema>;

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
          .select('status')
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
  const isActive = agenda.status === 'active' && 
    agenda.end_date && new Date(agenda.end_date) > new Date();

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMM d, yyyy - h:mm a');
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${!isActive ? 'bg-gray-50' : 'border-green-400 border-2'}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className={`text-xl ${!isActive ? 'text-gray-700' : 'text-green-700'}`}>
            {agenda.title}
          </CardTitle>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Active' : 'Closed'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className={`mb-3 ${!isActive ? 'text-gray-500' : 'text-gray-700'}`}>
          {agenda.description || "No description"}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-700 font-medium">Start:</span>
            <span className="ml-2 text-gray-600">{formatDateTime(agenda.start_date)}</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-700 font-medium">End:</span>
            <span className="ml-2 text-gray-600">{formatDateTime(agenda.end_date)}</span>
          </div>
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
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(agendaFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchAgendas();
    }
  }, [projectId]);

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
            start_date: values.start_date.toISOString(),
            end_date: values.end_date.toISOString(),
            status: 'draft',
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/projects">Projects</BreadcrumbLink>
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{project?.title}</h1>
              <p className="text-gray-600 mt-1">{project?.description || "No description provided."}</p>
              <p className="text-sm text-gray-500 mt-2">
                Created on {new Date(project?.created_at || "").toLocaleDateString()}
              </p>
            </div>
            
            <Button 
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> New Voting
            </Button>
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  const startDate = form.getValues("start_date");
                                  return startDate && date < startDate;
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
        </>
      )}
    </div>
  );
};

export default ProjectDetail;
