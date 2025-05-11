import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";
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
import { toast } from "sonner";
import Navigation from "@/components/layout/Navigation";
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
  created_at: string;
  title: string;
  description: string;
}

interface Agenda {
  id: string;
  created_at: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  project_id: string;
}

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isCreateAgendaDialogOpen, setIsCreateAgendaDialogOpen] = useState(false);
  const [newAgendaTitle, setNewAgendaTitle] = useState("");
  const [newAgendaDescription, setNewAgendaDescription] = useState("");
  const [newAgendaStartDate, setNewAgendaStartDate] = useState("");
  const [newAgendaEndDate, setNewAgendaEndDate] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) {
      console.error("Project ID is missing");
      return;
    }

    fetchProject(projectId);
    fetchAgendas(projectId);
  }, [projectId]);

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
      toast.error("Failed to load project");
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
      toast.error("Failed to load agendas");
    }
  };

  const handleCreateAgendaClick = () => {
    setIsCreateAgendaDialogOpen(true);
  };

  const handleCloseCreateAgendaDialog = () => {
    setIsCreateAgendaDialogOpen(false);
    setNewAgendaTitle("");
    setNewAgendaDescription("");
    setNewAgendaStartDate("");
    setNewAgendaEndDate("");
  };

  const handleCreateAgenda = async () => {
    try {
      if (!newAgendaTitle || !newAgendaDescription || !newAgendaStartDate || !newAgendaEndDate) {
        toast.error("Please fill in all fields");
        return;
      }

      if (!projectId) {
        toast.error("Project ID is missing");
        return;
      }

      const { data, error } = await supabase
        .from('agendas')
        .insert([
          {
            title: newAgendaTitle,
            description: newAgendaDescription,
            start_date: newAgendaStartDate,
            end_date: newAgendaEndDate,
            project_id: projectId,
            created_by: user?.id,
          },
        ])
        .select('*')

      if (error) {
        throw error;
      }

      setAgendas([...agendas, ...(data || [])]);
      handleCloseCreateAgendaDialog();
      toast.success("Agenda created successfully!");
    } catch (error: any) {
      console.error("Error creating agenda:", error.message);
      toast.error("Failed to create agenda");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (error) {
      return dateString.split('T')[0] || 'Unknown';
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
            <Button
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
              onClick={() => navigate(`/projects/${projectId}/voters`)}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Voters
            </Button>
            
            <Button
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
              onClick={handleCreateAgendaClick}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Agenda
            </Button>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Start Date</TableHead>
                <TableHead className="hidden md:table-cell">End Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendas.map((agenda) => (
                <TableRow key={agenda.id}>
                  <TableCell className="font-medium">{agenda.title}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(agenda.start_date)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(agenda.end_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${projectId}/agenda/${agenda.id}`)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Create Agenda Dialog Modal */}
      {isCreateAgendaDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Agenda</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="agendaTitle">Title</Label>
                <Input
                  type="text"
                  id="agendaTitle"
                  placeholder="Enter agenda title"
                  value={newAgendaTitle}
                  onChange={(e) => setNewAgendaTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="agendaDescription">Description</Label>
                <Textarea
                  id="agendaDescription"
                  placeholder="Enter agenda description"
                  value={newAgendaDescription}
                  onChange={(e) => setNewAgendaDescription(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agendaStartDate">Start Date</Label>
                  <Input
                    type="date"
                    id="agendaStartDate"
                    value={newAgendaStartDate}
                    onChange={(e) => setNewAgendaStartDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="agendaEndDate">End Date</Label>
                  <Input
                    type="date"
                    id="agendaEndDate"
                    value={newAgendaEndDate}
                    onChange={(e) => setNewAgendaEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-4">
              <Button variant="ghost" onClick={handleCloseCreateAgendaDialog}>
                Cancel
              </Button>
              <Button className="bg-evoting-600 hover:bg-evoting-700 text-white" onClick={handleCreateAgenda}>
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
