
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Vote as VoteIcon, Calendar, Info, CheckCircle, XCircle } from "lucide-react";

type Voter = {
  id: string;
  email: string;
  name: string;
  project_id: string;
  company_name: string;
  voting_weight: number;
};

type Project = {
  id: string;
  title: string;
  description: string | null;
};

type Agenda = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  project_id: string;
};

type Vote = {
  id: string;
  agenda_id: string;
  voter_id: string;
  option_id: string;
  value: string;
};

const VoterDashboard = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [voter, setVoter] = useState<Voter | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const voterData = sessionStorage.getItem('voter');
    
    if (!voterData) {
      toast.error("Please login to access the voter dashboard");
      navigate(`/projects/${projectId || 'all'}/voter-login`);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get voter from session storage
        const parsedVoter = JSON.parse(voterData) as Voter;
        setVoter(parsedVoter);

        console.log("Voter data from session:", parsedVoter);
        
        // Fetch voter's projects - either the specific project or all projects they belong to
        let projectQuery = supabase.from('projects').select('*');
        
        if (projectId && projectId !== 'all') {
          projectQuery = projectQuery.eq('id', projectId);
        } else if (parsedVoter.project_id) {
          projectQuery = projectQuery.eq('id', parsedVoter.project_id);
        } else {
          // If no specific project, try to find projects this voter belongs to
          const { data: voterProjects, error: voterProjectsError } = await supabase
            .from('voters')
            .select('project_id')
            .eq('email', parsedVoter.email);
            
          if (voterProjectsError) throw voterProjectsError;
          
          if (voterProjects && voterProjects.length > 0) {
            const projectIds = voterProjects.map(vp => vp.project_id);
            projectQuery = projectQuery.in('id', projectIds);
          }
        }
        
        const { data: projectData, error: projectError } = await projectQuery.limit(1).single();
        
        if (projectError && projectError.code !== 'PGRST116') {
          console.error("Error fetching project:", projectError);
          throw projectError;
        }
        
        if (projectData) {
          setProject(projectData);
          
          // Once we have a project, fetch agendas for that project
          const { data: agendasData, error: agendasError } = await supabase
            .from('agendas')
            .select('*')
            .eq('project_id', projectData.id)
            .order('created_at', { ascending: false });
            
          if (agendasError) throw agendasError;
          
          if (agendasData) {
            setAgendas(agendasData);
            
            // Fetch votes by this voter for these agendas
            if (parsedVoter.id) {
              const { data: votesData, error: votesError } = await supabase
                .from('votes')
                .select('*')
                .eq('voter_id', parsedVoter.id);
                
              if (votesError) throw votesError;
              
              if (votesData) {
                setVotes(votesData);
              }
            }
          }
        } else {
          console.log("No projects found for voter with email:", parsedVoter.email);
        }
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, projectId]);

  const handleLogout = () => {
    sessionStorage.removeItem('voter');
    navigate(`/projects/${projectId || 'all'}/voter-login`);
    toast.success("Logged out successfully");
  };

  const getAgendaStatus = (agenda: Agenda) => {
    const now = new Date();
    const startDate = agenda.start_date ? new Date(agenda.start_date) : null;
    const endDate = agenda.end_date ? new Date(agenda.end_date) : null;
    
    if (agenda.status === 'draft') return "Not yet published";
    if (agenda.status === 'completed') return "Completed";
    
    if (startDate && now < startDate) return "Upcoming";
    if (endDate && now > endDate) return "Ended";
    
    return "Active";
  };

  const hasVoted = (agendaId: string) => {
    return votes.some(vote => vote.agenda_id === agendaId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <VoteIcon className="text-evoting-600 h-6 w-6" />
            <span className="text-xl md:text-2xl font-bold text-evoting-800">
              The-eVoting
            </span>
          </div>
          <div className="flex gap-4 items-center">
            {voter && (
              <span className="hidden md:block text-gray-600">
                Logged in as: <span className="font-semibold">{voter.name || voter.email}</span>
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {voter && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-2">Voter Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{voter.name || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{voter.email}</p>
              </div>
              {voter.company_name && (
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{voter.company_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Voting Weight</p>
                <p className="font-medium">{voter.voting_weight || 1}</p>
              </div>
            </div>
          </div>
        )}
        
        {project ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{project.title}</h1>
              {project.description && (
                <p className="text-gray-600">{project.description}</p>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Available Agendas</h2>
              
              {agendas.length === 0 ? (
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <Info className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500">No agendas are currently available for this project.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agendas
                    .filter(agenda => agenda.status !== 'draft') // Only show published agendas
                    .map(agenda => {
                      const status = getAgendaStatus(agenda);
                      const voted = hasVoted(agenda.id);
                      
                      return (
                        <Card key={agenda.id} className={`overflow-hidden border ${
                          status === "Active" ? "border-green-200" : ""
                        }`}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold">{agenda.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {agenda.description || "No description provided"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Status:</span>
                                <span className={`font-medium ${
                                  status === "Active" ? "text-green-600" : 
                                  status === "Upcoming" ? "text-blue-600" : 
                                  status === "Ended" ? "text-gray-600" : 
                                  status === "Completed" ? "text-purple-600" : ""
                                }`}>{status}</span>
                              </div>
                              {agenda.start_date && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Start:</span>
                                  <span>{new Date(agenda.start_date).toLocaleString()}</span>
                                </div>
                              )}
                              {agenda.end_date && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">End:</span>
                                  <span>{new Date(agenda.end_date).toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Voted:</span>
                                <span className="flex items-center">
                                  {voted ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                                      Yes
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 text-red-600 mr-1" />
                                      No
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                            {status === "Active" && !voted && (
                              <Button 
                                className="w-full bg-evoting-600 hover:bg-evoting-700"
                                asChild
                              >
                                <Link to={`/voter/meeting/${project.id}/${agenda.id}`}>
                                  Cast Vote
                                </Link>
                              </Button>
                            )}
                            {status === "Active" && voted && (
                              <Button 
                                variant="outline"
                                className="w-full"
                                asChild
                              >
                                <Link to={`/voter/meeting/${project.id}/${agenda.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            )}
                            {status === "Completed" && (
                              <Button 
                                variant="outline"
                                className="w-full"
                                asChild
                              >
                                <Link to={`/projects/${project.id}/agenda/${agenda.id}/results`}>
                                  View Results
                                </Link>
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Projects Found</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              You don't have access to any projects yet. Please contact your administrator if you believe this is an error.
            </p>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-50 border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} The-eVoting. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default VoterDashboard;
