
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  admin: {
    name: string;
    company_name: string | null;
  } | null;
};

// Form schema for creating a new project
const projectFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string().default('draft'),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const ProjectSummary = () => {
  const [projectStats, setProjectStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchProjectStats = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('status')
        
        if (error) throw error;

        const stats = {
          total: data?.length || 0,
          active: data?.filter(p => p.status === 'active').length || 0,
          completed: data?.filter(p => p.status === 'completed').length || 0
        };
        
        setProjectStats(stats);
      } catch (error: any) {
        console.error("Error fetching project stats:", error.message);
      }
    };

    fetchProjectStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{projectStats.total}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">{projectStats.active}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Completed Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">{projectStats.completed}</p>
        </CardContent>
      </Card>
    </div>
  );
};

const ProjectCard = ({ project }: { project: Project }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{project.title}</CardTitle>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(project.status)}`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-2">{project.description || "No description"}</p>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500">
            <Calendar className="inline-block mr-1 h-4 w-4" />
            Created: {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild variant="outline" className="w-full">
          <Link to={`/projects/${project.id}`}>
            <span>Manage Project</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const Projects = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { user, isSuper, profile } = useAuth();
  const navigate = useNavigate();
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
    },
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          admin:admin_id(
            name,
            company_name
          )
        `);

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (error: any) {
      console.error("Error fetching projects:", error.message);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (values: ProjectFormValues) => {
    try {
      if (!user) {
        toast.error("You must be logged in to create a project");
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([
          { 
            title: values.title,
            description: values.description || null,
            admin_id: user.id,
            status: values.status || 'draft'
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast.success("Project created successfully!");
      setCreateDialogOpen(false);
      form.reset();
      fetchProjects();
    } catch (error: any) {
      console.error("Error creating project:", error.message);
      toast.error(error.message || "Failed to create project");
    }
  };
  
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Projects</h1>
            {profile && (
              <p className="text-gray-600 mt-1">
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium capitalize">
                  {profile.role.replace('_', ' ')}
                </span>
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {isSuper && (
              <Button variant="outline" asChild>
                <Link to="/admin/dashboard">Super Admin</Link>
              </Button>
            )}
            <Button 
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>
        </div>
        
        <ProjectSummary />
        
        <div className="mb-8 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            className="pl-10"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No projects found matching your search.</p>
            <Button 
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Create your first project
            </Button>
          </div>
        )}

        {/* Create Project Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to your dashboard.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateProject)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project title..." {...field} />
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
                          placeholder="Enter project description..." 
                          {...field} 
                          rows={3}
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
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-evoting-600 hover:bg-evoting-700 text-white">
                    Create Project
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Projects;
