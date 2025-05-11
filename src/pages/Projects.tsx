
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};

const ProjectCard = ({ project }: { project: Project }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "upcoming":
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
        <p className="text-sm text-gray-500">Created: {new Date(project.created_at).toLocaleDateString()}</p>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild variant="outline" className="w-full">
          <Link to={`/projects/${project.id}`}>
            Manage Project
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
  const { isSuper } = useAuth();
  
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*');

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
  
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        
        <div className="flex items-center gap-4">
          {isSuper && (
            <Button variant="outline" asChild>
              <Link to="/admin/dashboard">Super Admin</Link>
            </Button>
          )}
          <Button className="bg-evoting-600 hover:bg-evoting-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>
      </div>
      
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
          <Button className="bg-evoting-600 hover:bg-evoting-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Create your first project
          </Button>
        </div>
      )}
    </div>
  );
};

export default Projects;
