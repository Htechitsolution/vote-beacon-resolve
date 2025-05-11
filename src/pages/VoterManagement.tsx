
import React, { useState, useEffect } from "react";
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
import { X, Search, Users, Percent } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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
        .select("id, title")
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

  const filteredVoters = voters.filter((voter) =>
    voter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voter.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voter.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {profile?.role && (
              <Badge variant="outline" className="mt-2 capitalize">
                {profile.role.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Voter</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(addVoter)} className="space-y-4">
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
                  
                  <FormField
                    control={form.control}
                    name="voting_weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voting Weight (%)</FormLabel>
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
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-evoting-600 hover:bg-evoting-700"
                  >
                    Add Voter
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>Registered Voters</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search voters..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-evoting-600"></div>
              </div>
            ) : filteredVoters.length > 0 ? (
              <div className="border rounded-md mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Weight (%)</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteVoter(voter.id)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
