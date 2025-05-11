import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
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
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

type Vote = {
  id: string;
  option_id: string;
  voter_id: string;
  value: string;
  voting_weight: number;
  agenda_id: string;
  created_at: string;
};

type VoteResult = {
  option_id: string;
  option_title: string;
  approve: number;
  reject: number;
  abstain: number;
  total_weight: number;
  approve_percentage: number;
  file_name?: string | null;
  file_path?: string | null;
};

const AgendaResults = () => {
  const { projectId, agendaId } = useParams<{ projectId: string; agendaId: string }>();
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<VoteResult[]>([]);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (projectId && agendaId) {
      fetchData();
    }
  }, [projectId, agendaId]);

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

      // Fetch votes with the correct schema that now includes the 'value' field
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('agenda_id', agendaId);

      if (votesError) throw votesError;
      
      // Process votes data and calculate results
      calculateResults(optionsData || [], votesData || []);
      
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      toast.error("Failed to load agenda results");
    } finally {
      setLoading(false);
    }
  };

  const calculateResults = (optionsList: Option[], votes: Vote[]) => {
    const resultsByOption: Record<string, VoteResult> = {};
    
    // Initialize results for each option
    optionsList.forEach(option => {
      resultsByOption[option.id] = {
        option_id: option.id,
        option_title: option.title,
        approve: 0,
        reject: 0,
        abstain: 0,
        total_weight: 0,
        approve_percentage: 0,
        file_name: option.file_name,
        file_path: option.file_path
      };
    });
    
    // Count votes
    votes.forEach(vote => {
      if (resultsByOption[vote.option_id]) {
        const weight = vote.voting_weight || 1;
        
        if (vote.value === 'approve') {
          resultsByOption[vote.option_id].approve += weight;
        } else if (vote.value === 'reject') {
          resultsByOption[vote.option_id].reject += weight;
        } else if (vote.value === 'abstain') {
          resultsByOption[vote.option_id].abstain += weight;
        }
        
        resultsByOption[vote.option_id].total_weight += weight;
      }
    });
    
    // Calculate percentages
    Object.values(resultsByOption).forEach(result => {
      const totalVoted = result.approve + result.reject; // Don't include abstain in percentage calculation
      result.approve_percentage = totalVoted > 0 ? (result.approve / totalVoted) * 100 : 0;
    });
    
    setResults(Object.values(resultsByOption));
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
            <BreadcrumbItem>
              <Link to={`/projects/${projectId}/agenda/${agendaId}`}>{agenda?.title}</Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Results</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">{agenda?.title} - Results</h1>
              <p className="text-gray-600">{agenda?.description}</p>
            </div>
            <Button variant="outline" asChild>
              <Link to={`/projects/${projectId}/agenda/${agendaId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Agenda
              </Link>
            </Button>
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Voting Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No voting data available yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Option</TableHead>
                    <TableHead>Approve</TableHead>
                    <TableHead>Reject</TableHead>
                    <TableHead>Abstain</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.option_id}>
                      <TableCell className="font-medium">{result.option_title}</TableCell>
                      <TableCell>{result.approve} ({Math.round(result.approve_percentage)}%)</TableCell>
                      <TableCell>{result.reject} ({Math.round(100 - result.approve_percentage)}%)</TableCell>
                      <TableCell>{result.abstain}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Progress value={result.approve_percentage} className="h-2" />
                          {result.approve_percentage >= 50 ? (
                            <Badge variant="success">Passed</Badge>
                          ) : (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.file_path && result.file_name ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownloadFile(result.file_path!, result.file_name!)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgendaResults;
