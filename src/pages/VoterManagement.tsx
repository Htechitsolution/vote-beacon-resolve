import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Download, Trash2, Edit, Mail, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Navigation from "@/components/layout/Navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { sendEmail } from "@/lib/emailUtils";

const VoterManagement = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [voters, setVoters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddVoterDialogOpen, setIsAddVoterDialogOpen] = useState(false);
  const [isEditVoterDialogOpen, setIsEditVoterDialogOpen] = useState(false);
  const [newVoterName, setNewVoterName] = useState("");
  const [newVoterEmail, setNewVoterEmail] = useState("");
  const [newVoterCompany, setNewVoterCompany] = useState("");
  const [editingVoter, setEditingVoter] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const { user, profile } = useAuth();
  const [sendingBulkEmails, setSendingBulkEmails] = useState(false);
  const [sendingSingleEmail, setSendingSingleEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        throw projectError;
      }

      setProject(projectData);

      // Fetch voters for the project
      const { data: votersData, error: votersError } = await supabase
        .from('voters')
        .select('*')
        .eq('project_id', projectId);

      if (votersError) {
        throw votersError;
      }

      setVoters(votersData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      toast({
        title: "Error",
        description: "Failed to load voters",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openAddVoterDialog = () => {
    setIsAddVoterDialogOpen(true);
    setNewVoterName("");
    setNewVoterEmail("");
    setNewVoterCompany("");
  };

  const closeAddVoterDialog = () => {
    setIsAddVoterDialogOpen(false);
  };

  const handleAddVoter = async () => {
    try {
      if (!newVoterName || !newVoterEmail) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }

      if (!projectId) {
        toast({
          title: "Error",
          description: "Project ID is missing",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('voters')
        .insert([
          {
            name: newVoterName,
            email: newVoterEmail,
            company_name: newVoterCompany,
            project_id: projectId,
            status: 'active'
          },
        ])
        .select('*');

      if (error) {
        throw error;
      }

      setVoters([...voters, ...(data || [])]);
      closeAddVoterDialog();
      toast({
        title: "Success",
        description: "Voter added successfully!"
      });
    } catch (error: any) {
      console.error("Error adding voter:", error.message);
      toast({
        title: "Error",
        description: "Failed to add voter: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditVoter = (voter: any) => {
    setEditingVoter(voter);
    setIsEditVoterDialogOpen(true);
  };

  const closeEditVoterDialog = () => {
    setIsEditVoterDialogOpen(false);
    setEditingVoter(null);
  };

  const handleUpdateVoter = async (updatedVoter: any) => {
    try {
      if (!updatedVoter.name || !updatedVoter.email) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('voters')
        .update({
          name: updatedVoter.name,
          email: updatedVoter.email,
          company_name: updatedVoter.company_name,
          voting_weight: updatedVoter.voting_weight
        })
        .eq('id', updatedVoter.id)
        .select('*');

      if (error) {
        throw error;
      }

      setVoters(voters.map(voter => (voter.id === updatedVoter.id ? (data && data[0] ? data[0] : voter) : voter)));
      closeEditVoterDialog();
      toast({
        title: "Success",
        description: "Voter updated successfully!"
      });
    } catch (error: any) {
      console.error("Error updating voter:", error.message);
      toast({
        title: "Error",
        description: "Failed to update voter: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteVoter = async (voterId: string) => {
    try {
      const { error } = await supabase
        .from('voters')
        .delete()
        .eq('id', voterId);

      if (error) {
        throw error;
      }

      setVoters(voters.filter(voter => voter.id !== voterId));
      toast({
        title: "Success",
        description: "Voter deleted successfully!"
      });
    } catch (error: any) {
      console.error("Error deleting voter:", error.message);
      toast({
        title: "Error",
        description: "Failed to delete voter: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleExportCsv = () => {
    const csvRows = [];
    const headers = Object.keys(voters[0] || {}).join(',');
    csvRows.push(headers);

    for (const voter of voters) {
      const values = Object.values(voter).map(value => `"${value}"`).join(',');
      csvRows.push(values);
    }

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'voters.csv');
    a.click();
  };
  
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  const createVoterOTP = async (voterId: string, email: string): Promise<string> => {
    try {
      const otp = generateOTP();
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      
      const { data, error } = await supabase.rpc('create_voter_otp', {
        v_voter_id: voterId,
        v_email: email,
        v_otp: otp,
        v_expires_at: expiresAt.toISOString()
      });
      
      if (error) throw error;
      return otp;
    } catch (error) {
      console.error("Error creating OTP:", error);
      throw error;
    }
  };
  
  const sendVotingLink = async (voter: any) => {
    try {
      setSendingSingleEmail(voter.id);
      
      const otp = await createVoterOTP(voter.id, voter.email);
      
      const baseUrl = window.location.origin;
      const votingLink = `${baseUrl}/voter-meeting/${projectId}/${voter.id}`;
      
      const result = await sendEmail(
        voter.email,
        `Your Voting Link and OTP for ${project?.title || 'Meeting'} - ${otp}`,
        'votingLink',
        {
          recipientName: voter.name || 'Voter',
          projectName: project?.title || 'Meeting',
          votingLink,
          otp
        }
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Voting link sent to ${voter.email}`
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to send voting link: ${result.error}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error sending voting link:", error);
      toast({
        title: "Error",
        description: `Failed to send voting link: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSendingSingleEmail(null);
    }
  };
  
  const sendAllVotingLinks = async () => {
    try {
      setSendingBulkEmails(true);
      
      if (!voters.length) {
        toast({
          title: "Error",
          description: "No voters to send emails to",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Info",
        description: `Preparing to send voting links to ${voters.length} voters...`
      });
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const voter of voters) {
        try {
          const otp = await createVoterOTP(voter.id, voter.email);
          
          const baseUrl = window.location.origin;
          const votingLink = `${baseUrl}/voter-meeting/${projectId}/${voter.id}`;
          
          const result = await sendEmail(
            voter.email,
            `Your Voting Link and OTP for ${project?.title || 'Meeting'} - ${otp}`,
            'votingLink',
            {
              recipientName: voter.name || 'Voter',
              projectName: project?.title || 'Meeting',
              votingLink,
              otp
            }
          );
          
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to send to ${voter.email}:`, result.error);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to process voter ${voter.email}:`, error);
          errorCount++;
        }
      }
      
      if (errorCount === 0) {
        toast({
          title: "Success",
          description: `Successfully sent voting links to all ${successCount} voters`
        });
      } else {
        toast({
          title: "Warning",
          description: `Sent ${successCount} emails, but ${errorCount} failed.`,
          variant: "warning"
        });
      }
    } catch (error: any) {
      console.error("Error sending voting links:", error);
      toast({
        title: "Error",
        description: `Failed to send voting links: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setSendingBulkEmails(false);
    }
  };
  
  return (
    <div>
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
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
              <BreadcrumbPage>{project?.title || 'Manage Voters'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">{project?.title} - Manage Voters</h1>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportCsv} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export to CSV
            </Button>
            
            <Button 
              variant="outline" 
              onClick={sendAllVotingLinks} 
              disabled={sendingBulkEmails || voters.length === 0}
              className="flex items-center gap-2"
            >
              {sendingBulkEmails ? (
                <>
                  <span className="animate-spin h-4 w-4 border-b-2 rounded-full border-evoting-600"></span>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Email Voting Links
                </>
              )}
            </Button>
            
            <Button 
              onClick={openAddVoterDialog}
              className="bg-evoting-600 hover:bg-evoting-700 text-white flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add Voter
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Registered Voters</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
              </div>
            ) : voters.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voters.map((voter) => (
                      <TableRow key={voter.id}>
                        <TableCell className="font-medium">{voter.name || '—'}</TableCell>
                        <TableCell>{voter.email}</TableCell>
                        <TableCell>{voter.company_name || '—'}</TableCell>
                        <TableCell>{voter.voting_weight || '1'}</TableCell>
                        <TableCell>
                          <Badge variant={voter.status === 'voted' ? 'success' : voter.status === 'active' ? 'outline' : 'secondary'}>
                            {voter.status === 'voted' ? 'Voted' : voter.status === 'active' ? 'Active' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => sendVotingLink(voter)}
                              disabled={!!sendingSingleEmail}
                              className="h-8 w-8" 
                              title="Send Voting Link"
                            >
                              {sendingSingleEmail === voter.id ? (
                                <span className="animate-spin h-4 w-4 border-b-2 rounded-full border-evoting-600"></span>
                              ) : (
                                <MailCheck className="h-4 w-4 text-blue-500" />
                              )}
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEditVoter(voter)}
                              className="h-8 w-8" 
                              title="Edit Voter"
                            >
                              <Edit className="h-4 w-4 text-amber-500" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete Voter">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the voter from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteVoter(voter.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-600 mb-2">No voters found</h3>
                <p className="text-gray-500 mb-6">Add your first voter to get started</p>
                <Button onClick={openAddVoterDialog} className="bg-evoting-600 hover:bg-evoting-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Voter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Add Voter Dialog */}
        <Dialog open={isAddVoterDialogOpen} onOpenChange={setIsAddVoterDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Voter</DialogTitle>
              <DialogDescription>
                Add a new voter to the project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={newVoterName} onChange={(e) => setNewVoterName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={newVoterEmail} onChange={(e) => setNewVoterEmail(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">Company</Label>
                <Input id="company" value={newVoterCompany} onChange={(e) => setNewVoterCompany(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeAddVoterDialog}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleAddVoter}>Add Voter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Voter Dialog */}
        <Dialog open={isEditVoterDialogOpen} onOpenChange={setIsEditVoterDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Voter</DialogTitle>
              <DialogDescription>
                Update voter details.
              </DialogDescription>
            </DialogHeader>
            {editingVoter && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">Name</Label>
                  <Input id="edit-name" value={editingVoter.name || ''} onChange={(e) => setEditingVoter({ ...editingVoter, name: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">Email</Label>
                  <Input id="edit-email" type="email" value={editingVoter.email || ''} onChange={(e) => setEditingVoter({ ...editingVoter, email: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-company" className="text-right">Company</Label>
                  <Input id="edit-company" value={editingVoter.company_name || ''} onChange={(e) => setEditingVoter({ ...editingVoter, company_name: e.target.value })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-weight" className="text-right">Weight</Label>
                  <Input id="edit-weight" type="number" value={editingVoter.voting_weight || 1} onChange={(e) => setEditingVoter({ ...editingVoter, voting_weight: parseInt(e.target.value) })} className="col-span-3" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={closeEditVoterDialog}>
                Cancel
              </Button>
              <Button type="submit" onClick={() => handleUpdateVoter(editingVoter)}>Update Voter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VoterManagement;
