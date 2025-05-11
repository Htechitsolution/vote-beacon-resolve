import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  Plus,
  CalendarIcon,
  UsersIcon,
  ClipboardListIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import Navigation from "@/components/layout/Navigation";
import Head from "@/components/layout/Head";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  start_date: string | null;
  end_date: string | null;
  admin_id?: string;
}

interface Agenda {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  project_id: string;
  created_at: string;
  updated_at: string;
}

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isLoadingAgendas, setIsLoadingAgendas] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [voterCount, setVoterCount] = useState(0);
  
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
    },
  });
  
  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchAgendas();
      fetchVoterCount();
    }
  }, [projectId]);
  
const fetchProject = async () => {
  try {
    setIsLoadingProject(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    
    if (error) throw error;
    
    // Make sure we properly map the data to our Project interface
    const projectData: Project = {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status || 'draft',
      created_at: data.created_at,
      updated_at: data.updated_at,
      start_date: null, // Initialize with null as they may not exist in response
      end_date: null,   // Initialize with null as they may not exist in response
      admin_id: data.admin_id
    };
    
    // Assign start_date and end_date only if they exist in the data
    if ('start_date' in data) {
      projectData.start_date = data.start_date;
    }
    
    if ('end_date' in data) {
      projectData.end_date = data.end_date;
    }
    
    setProject(projectData);
  } catch (error: any) {
    console.error("Error fetching project:", error.message);
    toast.error("Failed to load project details");
  } finally {
    setIsLoadingProject(false);
  }
};
  
  const fetchAgendas = async () => {
    try {
      setIsLoadingAgendas(true);
      const { data, error } = await supabase
        .from("agendas")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      setAgendas(data || []);
    } catch (error: any) {
      console.error("Error fetching agendas:", error.message);
      toast.error("Failed to load agendas");
    } finally {
      setIsLoadingAgendas(false);
    }
  };
  
  const fetchVoterCount = async () => {
    try {
      const { count, error } = await supabase
        .from("voters")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      
      if (error) throw error;
      
      setVoterCount(count || 0);
    } catch (error: any) {
      console.error("Error fetching voter count:", error.message);
    }
  };
  
  const handleCreateAgenda = async (values: any) => {
    try {
      const { data, error } = await supabase
        .from("agendas")
        .insert({
          title: values.title,
          description: values.description,
          status: values.status,
          project_id: projectId,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Agenda created successfully");
      setIsDialogOpen(false);
      form.reset();
      
      // Add the new agenda to the list
      setAgendas([data, ...agendas]);
      
    } catch (error: any) {
      console.error("Error creating agenda:", error.message);
      toast.error("Failed to create agenda");
    }
  };
  
  const getStatusBadge = (status: string) => {
    const statusStyles = {
      draft: "bg-gray-100 text-gray-800",
      live: "bg-green-100 text-green-800",
      closed: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };
  
  if (isLoadingProject) {
    return (
      <div>
        <Navigation />
        <Head title="Loading Project | E-Voting Platform" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div>
        <Navigation />
        <Head title="Project Not Found | E-Voting Platform" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Project Not Found</h1>
            <p className="mt-2">The requested project could not be found.</p>
            <Button className="mt-4" asChild>
              <Link to="/projects">Back to Projects</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <Navigation />
      <Head title={`${project.title} | E-Voting Platform`} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              {getStatusBadge(project.status)}
            </div>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Always show the Add Agenda button, regardless of project status */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-evoting-600 hover:bg-evoting-700 text-white">
                  <Plus size={16} className="mr-1" />
                  Add Agenda
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Agenda</DialogTitle>
                  <DialogDescription>
                    Add an agenda item for this project
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateAgenda)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter agenda title" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter agenda description" 
                              {...field} 
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="live">Live</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-evoting-600 hover:bg-evoting-700 text-white">
                        Create Agenda
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {project.status !== "closed" && (
              <Button 
                variant="outline"
                onClick={() => navigate(`/projects/${projectId}/voters`)}
              >
                <UsersIcon size={16} className="mr-1" />
                Manage Voters ({voterCount})
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon size={16} className="text-evoting-600" />
                <h3 className="font-medium">Start Date</h3>
              </div>
              <p>{formatDate(project.start_date)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon size={16} className="text-evoting-600" />
                <h3 className="font-medium">End Date</h3>
              </div>
              <p>{formatDate(project.end_date)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardListIcon size={16} className="text-evoting-600" />
                <h3 className="font-medium">Agendas</h3>
              </div>
              <p>{agendas.length} agenda items</p>
            </CardContent>
          </Card>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Agendas</h2>
        
        {isLoadingAgendas ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-evoting-600"></div>
          </div>
        ) : agendas.length > 0 ? (
          <div className="space-y-4">
            {agendas.map((agenda) => (
              <Card key={agenda.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <Link 
                    to={`/projects/${projectId}/agenda/${agenda.id}`}
                    className="block p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{agenda.title}</h3>
                          {getStatusBadge(agenda.status || 'draft')}
                        </div>
                        <p className="text-gray-600 line-clamp-2">{agenda.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {formatDate(agenda.created_at)}
                        </p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-lg">
            <p className="text-gray-500">No agendas found for this project.</p>
            <Button 
              className="mt-4 bg-evoting-600 hover:bg-evoting-700 text-white"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus size={16} className="mr-1" />
              Create First Agenda
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
