
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
};

type Option = {
  id: string;
  title: string;
  description: string | null;
  agenda_id: string;
};

const AgendaDetail = () => {
  const { projectId, agendaId } = useParams<{ projectId: string, agendaId: string }>();
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (projectId && agendaId) {
      fetchProjectAndAgenda();
      fetchOptions();
    }
  }, [projectId, agendaId]);

  const fetchProjectAndAgenda = async () => {
    try {
      setLoading(true);
      
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, title')
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
      
    } catch (error: any) {
      console.error("Error fetching agenda details:", error.message);
      toast.error("Failed to load agenda details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('options')
        .select('*')
        .eq('agenda_id', agendaId);

      if (error) throw error;
      setOptions(data || []);
      
    } catch (error: any) {
      console.error("Error fetching options:", error.message);
      toast.error("Failed to load voting options");
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMMM d, yyyy - h:mm a');
  };

  const isActive = agenda?.status === 'active' && 
    agenda?.end_date && new Date(agenda.end_date) > new Date();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
        </div>
      </div>
    );
  }

  if (!agenda || !project) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Agenda Not Found</h1>
        <p className="mt-2">The voting agenda you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button className="mt-4" asChild>
          <Link to={`/projects/${projectId}`}>Back to Project</Link>
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
            <BreadcrumbLink as={Link} to={`/projects/${projectId}`}>{project.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{agenda.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{agenda.title}</h1>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Active' : 'Closed'}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4">{agenda.description || "No description provided."}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Voting Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Start:</span>
                  <span className="ml-2 font-medium">{formatDateTime(agenda.start_date)}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">End:</span>
                  <span className="ml-2 font-medium">{formatDateTime(agenda.end_date)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Voting Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium capitalize">
                {agenda.voting_type.replace('_', ' ')}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Voting Options</h2>
            <Button
              variant="outline"
              className="text-sm"
              asChild
            >
              <Link to={`/projects/${projectId}/agenda/${agendaId}/manage`}>
                Manage Options
              </Link>
            </Button>
          </div>
          
          {options.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">No voting options have been added yet.</p>
              <Button asChild>
                <Link to={`/projects/${projectId}/agenda/${agendaId}/manage`}>
                  Add Options
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((option) => (
                <Card key={option.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{option.description || "No description"}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Voters</h2>
            <Button
              variant="outline"
              className="text-sm"
              asChild
            >
              <Link to={`/projects/${projectId}/agenda/${agendaId}/voters`}>
                Manage Voters
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">Manage voters and view voting results</p>
                </div>
                <Button asChild>
                  <Link to={`/projects/${projectId}/agenda/${agendaId}/results`}>
                    View Results
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgendaDetail;
