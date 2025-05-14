
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/layout/Navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Search, Users, Percent, Trash2, Download, Upload, Mail, MailCheck } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Voter {
  id: string;
  name: string;
  email: string;
  company_name?: string | null;
  voting_weight: number;
  status: string;
}

interface Project {
  id: string;
  title: string;
}

interface Agenda {
  id: string;
  title: string;
  status: string;
}

const voterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company_name: z.string().optional(),
  voting_weight: z.coerce.number()
    .min(0.01, "Voting weight must be greater than 0")
    .max(100, "Voting weight cannot exceed 100%"),
});

type VoterFormValues = z.infer<typeof voterSchema>;

const VoterManagement = () => {
  const { projectId, agendaId } = useParams<{ projectId: string, agendaId: string }>();
  const { profile } = useAuth();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalWeight, setTotalWeight] = useState(0);
  const [uniqueCompanies, setUniqueCompanies] = useState<Map<string, number>>(new Map());
  const [sendingEmails, setSendingEmails] = useState<Record<string, boolean>>({});
  const [sendingAllEmails, setSendingAllEmails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<VoterFormValues>({
    resolver: zodResolver(voterSchema),
    defaultValues: {
      name: "",
      email: "",
      company_name: "",
      voting_weight: 1,
    },
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchVoters();
      if (agendaId) {
        fetchAgendaDetails();
      }
    }
  }, [projectId, agendaId]);

  useEffect(() => {
    calculateTotalWeight();
  }, [voters]);

  const fetchProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      console.error("Error fetching project:", error.message);
      toast.error("Failed to load project details");
    }
  };

  const fetchAgendaDetails = async () => {
    if (!agendaId) return;
    
    try {
      const { data, error } = await supabase
        .from("agendas")
        .select("id, title, status")
        .eq("id", agendaId)
        .single();

      if (error) throw error;
      setAgenda(data);
    } catch (error: any) {
      console.error("Error fetching agenda:", error.message);
      toast.error("Failed to load agenda details");
    }
  };

  const fetchVoters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("voters")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      setVoters(data || []);
    } catch (error: any) {
      console.error("Error fetching voters:", error.message);
      toast.error("Failed to load voters");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalWeight = () => {
    // Create a map to track companies and their voting weights
    const companies = new Map<string, number>();
    let total = 0;

    voters.forEach(voter => {
      const company = voter.company_name || voter.email;
      
      // If this company is already counted, don't add to total
      if (!companies.has(company)) {
        companies.set(company, voter.voting_weight);
        total += voter.voting_weight;
      }
    });

    setUniqueCompanies(companies);
    setTotalWeight(total);
  };

  const addVoter = async (data: VoterFormValues) => {
    try {
      // Check if adding this voter would exceed 100%
      let newTotal = totalWeight;
      const company = data.company_name || data.email;
      
      // Only add to total if company is new
      if (!uniqueCompanies.has(company)) {
        newTotal += data.voting_weight;
      }
      
      if (newTotal > 100) {
        toast.error("Total voting weight cannot exceed 100%");
        return;
      }

      // Check if voter with the same email already exists for this project
      const { data: existingVoters, error: checkError } = await supabase
        .from("voters")
        .select("id")
        .eq("project_id", projectId)
        .eq("email", data.email);

      if (checkError) throw checkError;

      if (existingVoters && existingVoters.length > 0) {
        toast.error("A voter with this email already exists for this project");
        return;
      }

      const { error } = await supabase.from("voters").insert([
        {
          project_id: projectId,
          name: data.name,
          email: data.email,
          company_name: data.company_name || null,
          voting_weight: data.voting_weight,
          status: "pending",
        },
      ]);

      if (error) throw error;

      toast.success("Voter added successfully");
      form.reset();
      fetchVoters();
    } catch (error: any) {
      console.error("Error adding voter:", error.message);
      toast.error(error.message);
    }
  };

  const deleteVoter = async (id: string) => {
    try {
      const { error } = await supabase
        .from("voters")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Voter removed successfully");
      fetchVoters();
    } catch (error: any) {
      console.error("Error removing voter:", error.message);
      toast.error(error.message);
    }
  };

  const sendVotingLinkEmail = async (voter: Voter) => {
    try {
      setSendingEmails(prev => ({ ...prev, [voter.id]: true }));
      
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in the database with expiration time (15 mins)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      // Store the OTP in the voter_otps table
      const { error: otpError } = await supabase.rpc('create_voter_otp', {
        v_voter_id: voter.id,
        v_email: voter.email,
        v_otp: otp,
        v_expires_at: expiresAt.toISOString()
      });
      
      if (otpError) throw otpError;
      
      // Prepare the voting link - this will be a deep link that can be used to access the voting page
      const votingLink = `${window.location.origin}/projects/${projectId}/voter-login`;
      
      // Send OTP via email using our edge function
      const { error: functionError } = await supabase.functions.invoke('send-voter-otp', {
        body: { 
          email: voter.email,
          otp: otp,
          voterName: voter.name,
          projectName: project?.title || "Meeting",
          votingLink: votingLink
        }
      });
      
      if (functionError) throw functionError;
      
      toast.success(`Voting link sent to ${voter.email}`);
    } catch (error: any) {
      console.error("Error sending voting link:", error.message);
      toast.error(`Failed to send voting link: ${error.message}`);
    } finally {
      setSendingEmails(prev => ({ ...prev, [voter.id]: false }));
    }
  };
  
  const sendAllVotingLinks = async () => {
    try {
      setSendingAllEmails(true);
      let successCount = 0;
      let errorCount = 0;
      
      for (const voter of voters) {
        try {
          // Generate a 6-digit OTP
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          
          // Store OTP in the database with expiration time (15 mins)
          const expiresAt = new Date();
          expiresAt.setMinutes(expiresAt.getMinutes() + 15);
          
          // Store the OTP in the voter_otps table
          const { error: otpError } = await supabase.rpc('create_voter_otp', {
            v_voter_id: voter.id,
            v_email: voter.email,
            v_otp: otp,
            v_expires_at: expiresAt.toISOString()
          });
          
          if (otpError) throw otpError;
          
          // Prepare the voting link
          const votingLink = `${window.location.origin}/projects/${projectId}/voter-login`;
          
          // Send OTP via email using our edge function
          const { error: functionError } = await supabase.functions.invoke('send-voter-otp', {
            body: { 
              email: voter.email,
              otp: otp,
              voterName: voter.name,
              projectName: project?.title || "Meeting",
              votingLink: votingLink
            }
          });
          
          if (functionError) throw functionError;
          
          successCount++;
        } catch (error) {
          console.error(`Failed to send to ${voter.email}:`, error);
          errorCount++;
        }
        
        // Add a small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (errorCount === 0) {
        toast.success(`Successfully sent voting links to all ${successCount} voters`);
      } else {
        toast.warning(`Sent ${successCount} emails, but ${errorCount} failed. Check console for details.`);
      }
    } catch (error: any) {
      console.error("Error sending voting links:", error.message);
      toast.error("Failed to send voting links");
    } finally {
      setSendingAllEmails(false);
    }
  };

  const downloadVoterTemplate = () => {
    // Create CSV template
    const headers = "Name,Email,Company,Voting Weight\n";
    const example = "John Doe,john@example.com,ACME Inc,1\n";
    const csvContent = headers + example;
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "voters_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target?.result as string;
        const lines = csvData.split("\n");
        
        // Remove header row
        lines.shift();
        
        const votersToAdd = [];
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const [name, email, company, weightStr] = line.split(",");
          const weight = parseFloat(weightStr) || 1;
          
          if (name && email) {
            votersToAdd.push({
              project_id: projectId,
              name: name.trim(),
              email: email.trim(),
              company_name: company ? company.trim() : null,
              voting_weight: weight,
              status: "pending",
            });
          }
        }
        
        if (votersToAdd.length === 0) {
          toast.error("No valid voters found in the file");
          return;
        }
        
        // Add voters to database
        const { data, error } = await supabase
          .from("voters")
          .insert(votersToAdd);
          
        if (error) {
          if (error.message.includes("duplicate key")) {
            toast.error("Some voters could not be added due to duplicate emails");
          } else {
            throw error;
          }
        } else {
          toast.success(`${votersToAdd.length} voters added successfully`);
          fetchVoters();
        }
      } catch (error: any) {
        console.error("Error uploading voters:", error.message);
        toast.error("Failed to process the uploaded file");
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const downloadVotersList = () => {
    // Create CSV with all voters
    let csvContent = "Name,Email,Company,Voting Weight,Status\n";
    
    voters.forEach(voter => {
      const row = [
        voter.name,
        voter.email,
        voter.company_name || "",
        voter.voting_weight,
        voter.status
      ].join(",");
      csvContent += row + "\n";
    });
    
    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `voters_${project?.title || "project"}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVoters = voters.filter((voter) =>
    voter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voter.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voter.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isVotingClosed = agenda?.status === "closed";

  return (
    <div>
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
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
              <Link to={`/projects/${projectId}`}>{project?.title || "Project"}</Link>
            </BreadcrumbItem>
            {agenda && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <Link to={`/projects/${projectId}/agenda/${agendaId}`}>{agenda.title}</Link>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              Manage Voters
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Manage Voters</h1>
            <p className="text-gray-600">
              Add and manage voters for {agenda ? `agenda: ${agenda.title}` : `project: ${project?.title}`}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">Registration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Voters</p>
                    <p className="text-xl font-semibold">{voters.length}</p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
                  <Percent className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Weight</p>
                    <p className="text-xl font-semibold">{totalWeight}%</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">Unique Companies</p>
                    <p className="text-xl font-semibold">{uniqueCompanies.size}</p>
                  </div>
                </div>
              </div>
              
              {!isVotingClosed && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-lg mb-4">Add New Voter</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(addVoter)} className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Voter name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-[200px]">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Email address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-[200px]">
                        <FormField
                          control={form.control}
                          name="company_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Company name (optional)" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="w-[120px]">
                        <FormField
                          control={form.control}
                          name="voting_weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0.01"
                                  max="100"
                                  step="0.01"
                                  placeholder="1" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex items-end mb-1">
                        <Button 
                          type="submit" 
                          className="bg-evoting-600 hover:bg-evoting-700"
                        >
                          Add Voter
                        </Button>
                      </div>
                    </form>
                  </Form>

                  <div className="flex items-center gap-3 mt-5 border-t pt-4">
                    <Button variant="outline" onClick={downloadVoterTemplate} className="flex items-center gap-2">
                      <Download size={16} />
                      Download Template
                    </Button>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        id="csv-upload"
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                        <Upload size={16} />
                        Upload CSV
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Registered Voters</h2>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search voters..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={downloadVotersList}
              className="flex items-center gap-2"
              disabled={voters.length === 0}
            >
              <Download size={16} />
              Export CSV
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={sendAllVotingLinks}
              disabled={voters.length === 0 || sendingAllEmails}
            >
              <Mail size={16} />
              {sendingAllEmails ? "Sending..." : "Email All Voting Links"}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-evoting-600"></div>
              </div>
            ) : filteredVoters.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Weight (%)</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVoters.map((voter) => (
                    <TableRow key={voter.id}>
                      <TableCell className="font-medium">{voter.name}</TableCell>
                      <TableCell>{voter.email}</TableCell>
                      <TableCell>{voter.company_name || "-"}</TableCell>
                      <TableCell className="text-right">{voter.voting_weight}</TableCell>
                      <TableCell className="text-right capitalize">{voter.status}</TableCell>
                      <TableCell className="flex gap-2 items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => sendVotingLinkEmail(voter)}
                          disabled={sendingEmails[voter.id]}
                          title="Send voting link"
                        >
                          {sendingEmails[voter.id] ? (
                            <span className="flex items-center">
                              <span className="animate-spin mr-1 h-4 w-4 border-b-2 rounded-full border-evoting-600"></span>
                              Sending
                            </span>
                          ) : (
                            <>
                              <Mail className="h-3.5 w-3.5 text-evoting-600" />
                              Link
                            </>
                          )}
                        </Button>
                        
                        {!isVotingClosed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteVoter(voter.id)}
                            title="Remove voter"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No voters found. {searchTerm && "Try adjusting your search."}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            className="mr-2"
            asChild
          >
            {agendaId ? (
              <Link to={`/projects/${projectId}/agenda/${agendaId}`}>Back to Agenda</Link>
            ) : (
              <Link to={`/projects/${projectId}`}>Back to Project</Link>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoterManagement;
