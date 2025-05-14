import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, Copy, UserPlus, XCircle } from "lucide-react";
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
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Voter = {
  id: string;
  project_id: string;
  name: string;
  email: string;
  created_at: string;
};

const VoterManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingVoterDialogOpen, setIsAddingVoterDialogOpen] = useState(false);
  const [newVoterName, setNewVoterName] = useState("");
  const [newVoterEmail, setNewVoterEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const { user } = useAuth();

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
        .eq('project_id', window.location.pathname.split('/')[2]);

      if (error) throw error;

      setVoters(data || []);
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
    setIsAddingVoterDialogOpen(true);
  };

  const handleAddVoter = async () => {
    try {
      if (!user) {
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
        .eq('project_id', window.location.pathname.split('/')[2])
        .eq('email', newVoterEmail.toLowerCase());

      if (existingVoterError) throw existingVoterError;

      if (existingVoter && existingVoter.length > 0) {
        toast.error("This email is already registered for this project.");
        return;
      }

      // Insert the new voter
      const { data, error } = await supabase
        .from('voters')
        .insert([
          {
            project_id: window.location.pathname.split('/')[2],
            name: newVoterName,
            email: newVoterEmail.toLowerCase(),
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
      
      // Send OTP via email
      const { data, error } = await supabase.functions.invoke('send-voter-otp', {
        body: {
          email: voter.email,
          name: voter.name || 'Voter',
          otp
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

  const filteredVoters = voters.filter((voter) =>
    voter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voter.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <Button
            className="bg-evoting-600 hover:bg-evoting-700 text-white"
            onClick={openAddVoterDialog}
          >
            <UserPlus className="mr-2 h-4 w-4" /> Add Voter
          </Button>
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
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVoters.map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell className="font-medium">{voter.name}</TableCell>
                    <TableCell>{voter.email}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && filteredVoters.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No voters found matching your search.</p>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingVoterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVoter}>Add Voter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoterManagement;
