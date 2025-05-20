import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Copy, UserPlus, XCircle, Upload, Download } from "lucide-react";
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
import { format } from "date-fns";
import Navigation from "@/components/layout/Navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Papa from "papaparse";
import { sendVoterOTP } from "@/lib/emailUtils";

type Voter = {
  id: string;
  project_id: string;
  name: string;
  email: string;
  voting_weight: number;
  company_name?: string;
  created_at: string;
};

const VoterManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingVoterDialogOpen, setIsAddingVoterDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newVoterName, setNewVoterName] = useState("");
  const [newVoterEmail, setNewVoterEmail] = useState("");
  const [newVoterCompany, setNewVoterCompany] = useState("");
  const [newVoterWeight, setNewVoterWeight] = useState<number>(1);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [totalVotingWeight, setTotalVotingWeight] = useState(0);
  const { user } = useAuth();
  const { projectId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchVoters = async () => {
    try {
      setLoading(true);

      if (!user) {
        toast.error("You must be logged in to view voters.");
        return;
      }

      // Fetch voters for the project
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      const fetchedVoters = data || [];
      setVoters(fetchedVoters);
      
      // Calculate total voting weight
      const total = fetchedVoters.reduce((sum, voter) => {
        return sum + (voter.voting_weight || 1);
      }, 0);
      setTotalVotingWeight(total);
      
    } catch (error: any) {
      console.error("Error fetching voters:", error.message);
      toast.error("Failed to load voters.");
    } finally {
      setLoading(false);
    }
  };

  const openAddVoterDialog = () => {
    setNewVoterName("");
    setNewVoterEmail("");
    setNewVoterCompany("");
    setNewVoterWeight(1);
    setIsAddingVoterDialogOpen(true);
  };

  const handleAddVoter = async () => {
    try {
      if (!user || !projectId) {
        toast.error("You must be logged in to add voters.");
        return;
      }

      if (!newVoterName || !newVoterEmail) {
        toast.error("Please enter both name and email for the voter.");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newVoterEmail)) {
        toast.error("Please enter a valid email address.");
        return;
      }

      // Check if the email already exists for this project
      const { data: existingVoter, error: existingVoterError } = await supabase
        .from('voters')
        .select('*')
        .eq('project_id', projectId)
        .eq('email', newVoterEmail.toLowerCase());

      if (existingVoterError) throw existingVoterError;

      if (existingVoter && existingVoter.length > 0) {
        toast.error("This email is already registered for this project.");
        return;
      }

      // If company name is provided, check if any voter from the same company exists
      // and use their voting weight (do not reduce it)
      let votingWeightToUse = newVoterWeight;
      
      if (newVoterCompany) {
        const { data: sameCompanyVoters, error: companyError } = await supabase
          .from('voters')
          .select('voting_weight')
          .eq('project_id', projectId)
          .eq('company_name', newVoterCompany)
          .order('voting_weight', { ascending: false })
          .limit(1);
          
        if (companyError) throw companyError;
        
        // If voters from same company exist, use their voting weight if it's higher
        if (sameCompanyVoters && sameCompanyVoters.length > 0) {
          // Keep the user-entered weight or use existing company weight, whichever is higher
          votingWeightToUse = Math.max(newVoterWeight, sameCompanyVoters[0].voting_weight);
        }
      }

      // Insert the new voter with potentially adjusted voting weight
      const { data, error } = await supabase
        .from('voters')
        .insert([
          {
            project_id: projectId,
            name: newVoterName,
            email: newVoterEmail.toLowerCase(),
            company_name: newVoterCompany || null,
            voting_weight: votingWeightToUse
          },
        ])
        .select();

      if (error) throw error;

      toast.success("Voter added successfully!");
      setIsAddingVoterDialogOpen(false);
      fetchVoters();
    } catch (error: any) {
      console.error("Error adding voter:", error.message);
      toast.error(error.message || "Failed to add voter.");
    }
  };

  const sendLoginLink = async (voter: Voter) => {
    try {
      setSelectedVoter(voter);
      setSendingEmail(true);

      // Generate a random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create OTP record in the database
      const { error: otpError } = await supabase
        .rpc('create_voter_otp', {
          v_voter_id: voter.id,
          v_email: voter.email,
          v_otp: otp,
          v_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes expiry
        });
      
      if (otpError) throw otpError;
      
      // Get project name for email
      const { data: projectData } = await supabase
        .from('projects')
        .select('title')
        .eq('id', projectId)
        .single();
      
      // Send OTP via email
      const { data, error } = await supabase.functions.invoke('send-voter-otp', {
        body: {
          email: voter.email,
          name: voter.name || 'Voter',
          otp,
          projectName: projectData?.title || 'Meeting',
          votingLink: `${window.location.origin}/projects/${projectId}/voter-login`
        }
      });
      
      if (error) throw error;
      
      toast.success(`Login link sent to ${voter.email}`);
      
    } catch (error: any) {
      console.error('Error sending login link:', error);
      toast.error(`Failed to send login link: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleRemoveVoter = async (voter: Voter) => {
    try {
      if (!user) {
        toast.error("You must be logged in to remove voters.");
        return;
      }

      // Delete the voter
      const { error } = await supabase
        .from('voters')
        .delete()
        .eq('id', voter.id);

      if (error) throw error;

      toast.success("Voter removed successfully!");
      fetchVoters();
    } catch (error: any) {
      console.error("Error removing voter:", error.message);
      toast.error(error.message || "Failed to remove voter.");
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target?.result;
      if (typeof csvData === 'string') {
        try {
          Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              handleBulkUpload(results.data);
            }
          });
        } catch (error: any) {
          console.error("Error parsing CSV:", error);
          toast.error("Failed to parse CSV file. Please check the format.");
        }
      }
    };
    reader.readAsText(file);
  };
  
  const handleBulkUpload = async (data: any[]) => {
    if (!data.length) {
      toast.error("No data found in the CSV file.");
      return;
    }
    
    try {
      let successCount = 0;
      let failCount = 0;
      const requiredFields = ['name', 'email'];
      const errors: string[] = [];
      
      // Validate CSV has required headers
      const headers = Object.keys(data[0]);
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        toast.error(`CSV is missing required columns: ${missingFields.join(', ')}`);
        return;
      }
      
      // Process each row
      for (const row of data) {
        // Skip if required fields are empty
        if (!row.name || !row.email) {
          errors.push(`Skipped row with missing name or email: ${row.email || 'unknown'}`);
          failCount++;
          continue;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push(`Invalid email format: ${row.email}`);
          failCount++;
          continue;
        }
        
        // Check if voter exists
        const { data: existingVoter } = await supabase
          .from('voters')
          .select('id')
          .eq('project_id', projectId)
          .eq('email', row.email.toLowerCase());
          
        if (existingVoter && existingVoter.length > 0) {
          errors.push(`Email already exists: ${row.email}`);
          failCount++;
          continue;
        }
        
        // Add new voter
        const { error } = await supabase
          .from('voters')
          .insert([{
            project_id: projectId,
            name: row.name,
            email: row.email.toLowerCase(),
            company_name: row.company || null,
            voting_weight: parseFloat(row.weight) || 1
          }]);
          
        if (error) {
          errors.push(`Error adding ${row.email}: ${error.message}`);
          failCount++;
        } else {
          successCount++;
        }
      }
      
      // Refresh the voter list
      fetchVoters();
      
      // Show results
      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} voters`);
      }
      
      if (failCount > 0) {
        console.error("Upload errors:", errors);
        toast.error(`Failed to add ${failCount} voters. Check console for details.`);
      }
      
      // Close the upload dialog
      setIsUploadDialogOpen(false);
      
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      toast.error("Failed to process bulk upload.");
    }
  };
  
  const downloadCsvTemplate = () => {
    const headers = ["name", "email", "company", "weight"];
    const sampleData = [
      ["John Doe", "john@example.com", "ABC Corp", "1"],
      ["Jane Smith", "jane@example.com", "XYZ Inc", "2"]
    ];
    
    let csvContent = headers.join(",") + "\n";
    sampleData.forEach(row => {
      csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "voter_template.csv");
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVoters = voters.filter((voter) =>
    voter.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
              <BreadcrumbLink>
                <Link to="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Voter Management</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Voter Management</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Button>
            <Button
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
              onClick={openAddVoterDialog}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Add Voter
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-500">
            Total Voters: <span className="font-semibold">{voters.length}</span> |
            Total Voting Weight: <span className="font-semibold">{totalVotingWeight}</span>
          </div>
        </div>

        <div className="mb-8 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            className="pl-10"
            placeholder="Search voters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Weight %</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVoters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No voters found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVoters.map((voter) => (
                    <TableRow key={voter.id}>
                      <TableCell className="font-medium">{voter.name}</TableCell>
                      <TableCell>{voter.email}</TableCell>
                      <TableCell>{voter.company_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        {voter.voting_weight || 1}
                      </TableCell>
                      <TableCell className="text-right">
                        {totalVotingWeight > 0 
                          ? `${(((voter.voting_weight || 1) / totalVotingWeight) * 100).toFixed(2)}%` 
                          : '0%'}
                      </TableCell>
                      <TableCell>{format(new Date(voter.created_at), 'yyyy-MM-dd')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendLoginLink(voter)}
                            disabled={sendingEmail && selectedVoter?.id === voter.id}
                          >
                            {sendingEmail && selectedVoter?.id === voter.id ? (
                              <>Sending...</>
                            ) : (
                              <>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Link
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveVoter(voter)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Voter Dialog */}
      <Dialog open={isAddingVoterDialogOpen} onOpenChange={setIsAddingVoterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Voter</DialogTitle>
            <DialogDescription>
              Add a new voter to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newVoterName}
                onChange={(e) => setNewVoterName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newVoterEmail}
                onChange={(e) => setNewVoterEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Input
                id="company"
                value={newVoterCompany}
                onChange={(e) => setNewVoterCompany(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Voting Weight
              </Label>
              <Input
                id="weight"
                type="number"
                min="1"
                step="1"
                value={newVoterWeight}
                onChange={(e) => setNewVoterWeight(parseFloat(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingVoterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVoter}>Add Voter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Upload Voters</DialogTitle>
            <DialogDescription>
              Upload a CSV file with voter information. The CSV must include name and email columns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Download template:</span>
              <Button variant="outline" size="sm" onClick={downloadCsvTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
            
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Click below to select a CSV file
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select File
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              <p className="font-semibold">Required columns:</p>
              <ul className="list-disc list-inside ml-2">
                <li>name - Full name of the voter</li>
                <li>email - Email address (must be unique)</li>
                <li>company - Company name (optional)</li>
                <li>weight - Voting weight (optional, defaults to 1)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoterManagement;
