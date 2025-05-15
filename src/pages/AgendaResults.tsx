
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowLeft, Download, Mail } from "lucide-react";
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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

type Voter = {
  id: string;
  email: string;
  name: string;
  company_name?: string | null;
  project_id: string;
};

const AgendaResults = () => {
  const { projectId, agendaId } = useParams<{ projectId: string; agendaId: string }>();
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const { user, profile } = useAuth();
  const resultsRef = React.useRef<HTMLDivElement>(null);

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
      
      // Fetch voters
      const { data: votersData, error: votersError } = await supabase
        .from('voters')
        .select('id, email, name, company_name, project_id')
        .eq('project_id', projectId);

      if (votersError) throw votersError;
      setVoters(votersData || []);
      
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

  const generatePDF = async () => {
    if (!resultsRef.current) return;
    
    try {
      toast.info("Generating PDF...");
      
      const container = resultsRef.current;
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 190;
      const pageHeight = 290;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 10;
      
      // Add logo and header information
      pdf.setTextColor(0, 0, 255); // blue color for "The-eVoting"
      pdf.setFontSize(16);
      pdf.text("The-eVoting", 15, position + 10);
      pdf.setTextColor(0, 0, 0); // reset to black
      
      if (profile) {
        // Company name in the center
        pdf.setFontSize(14);
        pdf.text(profile.company_name || "", 105, position + 10, { align: 'center' });
        
        // Admin name
        pdf.setFontSize(12);
        pdf.text(profile.name, 105, position + 18, { align: 'center' });
        
        // IBC member code
        pdf.setFontSize(10);
        if (profile.ibc_registration_number) {
          pdf.text(`IBC Member Code: ${profile.ibc_registration_number}`, 105, position + 24, { align: 'center' });
        }
        
        // Address
        if (profile.communications_address) {
          pdf.setFontSize(10);
          pdf.text(profile.communications_address, 105, position + 30, { align: 'center' });
        }
        
        // Line
        pdf.setDrawColor(0, 0, 0);
        pdf.line(15, position + 35, 195, position + 35);
        
        position += 45;
      } else {
        position += 15;
      }
      
      // Meeting name (Project title)
      pdf.setFontSize(14);
      pdf.text(`${project?.title || 'Project'}`, 105, position, { align: 'center' });
      position += 8;
      
      // Meeting description - small text
      pdf.setFontSize(10);
      pdf.text(`${agenda?.description || ''}`, 105, position, { align: 'center' });
      position += 10;
      
      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`${project?.title || 'Project'}_${agenda?.title || 'Agenda'}_Results.pdf`);
      toast.success("PDF generated successfully");
      
      return pdf.output('blob');
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
      return null;
    }
  };

  const emailResultsToPDF = async () => {
    try {
      setSendingEmails(true);
      toast.info("Preparing to send results to voters...");
      
      // Generate PDF
      const pdfBlob = await generatePDF();
      if (!pdfBlob) {
        throw new Error("Failed to generate PDF");
      }
      
      // Create a FormData to upload the PDF to Supabase Storage
      const formData = new FormData();
      formData.append('file', pdfBlob, `${project?.title || 'Project'}_${agenda?.title || 'Agenda'}_Results.pdf`);
      
      const fileName = `results/${projectId}/${agendaId}/${Date.now()}.pdf`;
      
      // Upload PDF to Supabase Storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('voting-documents')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf'
        });
        
      if (fileError) throw fileError;
      
      // Get public URL of the file
      const { data: urlData } = await supabase.storage
        .from('voting-documents')
        .getPublicUrl(fileName);
        
      const fileUrl = urlData.publicUrl;
      
      // Send emails to all voters
      let successCount = 0;
      let errorCount = 0;
      
      for (const voter of voters) {
        try {
          // Send email using our edge function
          const { error: functionError } = await supabase.functions.invoke('send-voter-otp', {
            body: { 
              email: voter.email,
              otp: "RESULTS", // Not actually using this for OTP here
              voterName: voter.name || "Voter",
              projectName: project?.title || "Meeting",
              isResultEmail: true,
              resultTitle: agenda?.title || "Voting",
              resultUrl: fileUrl
            }
          });
          
          if (functionError) throw functionError;
          
          successCount++;
        } catch (error) {
          console.error(`Failed to send results to ${voter.email}:`, error);
          errorCount++;
        }
        
        // Add a small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (errorCount === 0) {
        toast.success(`Successfully sent results to all ${successCount} voters`);
      } else {
        toast.warning(`Sent ${successCount} emails, but ${errorCount} failed. Check console for details.`);
      }
      
    } catch (error: any) {
      console.error("Error sending results:", error.message);
      toast.error(`Failed to send results: ${error.message}`);
    } finally {
      setSendingEmails(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "yyyy-MM-dd HH:mm");
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
              <p className="text-gray-600 mt-2">
                <span className="font-semibold">End Date:</span> {formatDateTime(agenda?.end_date)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generatePDF} className="flex items-center gap-2">
                <Download className="mr-1 h-4 w-4" />
                Download Results
              </Button>
              <Button 
                variant="outline" 
                onClick={emailResultsToPDF} 
                disabled={sendingEmails || voters.length === 0} 
                className="flex items-center gap-2"
              >
                {sendingEmails ? (
                  <>
                    <span className="animate-spin mr-1 h-4 w-4 border-b-2 rounded-full border-evoting-600"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-1 h-4 w-4" />
                    Email Results
                  </>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/projects/${projectId}/agenda/${agendaId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Agenda
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        <div ref={resultsRef}>
          {/* PDF Header - This will only be visible in the PDF, not in the UI */}
          <div className="hidden">
            <div className="flex items-start">
              <div className="w-1/3">
                <div className="text-blue-600 font-bold text-xl">The-eVoting</div>
              </div>
              <div className="w-1/3 text-center">
                <div className="font-semibold text-lg">{profile?.company_name}</div>
                <div>{profile?.name}</div>
                <div className="text-sm">IBC Member Code: {profile?.ibc_registration_number}</div>
                <div className="text-sm">{profile?.communications_address}</div>
              </div>
              <div className="w-1/3"></div>
            </div>
            <div className="border-b-2 border-gray-300 my-4"></div>
            <div className="text-center font-bold text-lg mb-2">{project.title}</div>
            <div className="text-center text-sm mb-6">{agenda.description}</div>
          </div>
          
          {/* Visible Header with Logo for UI */}
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 overflow-hidden">
                  <AspectRatio ratio={1/1} className="bg-blue-600 text-white flex items-center justify-center rounded">
                    <span className="font-bold text-xs">The-eVoting</span>
                  </AspectRatio>
                </div>
                <div>
                  <CardTitle>{agenda?.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Voting ended: {formatDateTime(agenda?.end_date)}
                  </div>
                </div>
              </div>
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
    </div>
  );
};

export default AgendaResults;
