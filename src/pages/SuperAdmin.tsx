
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, IndianRupee } from "lucide-react";
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
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import Navigation from "@/components/layout/Navigation";
import SuperAdminRole from "@/components/SuperAdminRole";
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

type Profile = {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  role: "super_admin" | "admin" | "voter";
  credits: number;
  created_at: string;
  updated_at: string;
  meeting_count?: number;
};

const SuperAdmin = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddCreditsDialogOpen, setIsAddCreditsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState<number>(0);
  const { isSuper } = useAuth();
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;
      
      // Fetch all meetings to count per admin
      const { data: agendasData, error: agendasError } = await supabase
        .from('agendas')
        .select('id, project_id');
        
      if (agendasError) throw agendasError;
      
      // Fetch all projects to link them to admins
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, admin_id');
        
      if (projectsError) throw projectsError;
      
      // Calculate meeting count for each admin
      const usersWithMeetingCount = profilesData.map(user => {
        const userProjects = projectsData.filter(project => project.admin_id === user.id).map(p => p.id);
        const meetingCount = agendasData.filter(agenda => userProjects.includes(agenda.project_id)).length;
        
        return {
          ...user,
          meeting_count: meetingCount,
          credits: user.credits || 0 // Ensure credits exist
        };
      });

      setUsers(usersWithMeetingCount || []);
    } catch (error: any) {
      console.error("Error fetching users:", error.message);
      toast("Error", {
        description: "Failed to load users"
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddCreditsDialog = (user: Profile) => {
    setSelectedUser(user);
    setCreditsToAdd(0);
    setIsAddCreditsDialogOpen(true);
  };

  const handleAddCredits = async () => {
    if (!selectedUser || creditsToAdd <= 0) {
      toast("Error", {
        description: "Please enter a valid number of credits to add",
        variant: "destructive"
      });
      return;
    }

    try {
      // Calculate new credit total
      const newCreditTotal = (selectedUser.credits || 0) + creditsToAdd;
      
      // Update user credits in the database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          credits: newCreditTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id 
            ? { ...user, credits: newCreditTotal } 
            : user
        )
      );
      
      setIsAddCreditsDialogOpen(false);
      toast("Success", {
        description: `${creditsToAdd} credits added to ${selectedUser.name}'s account`
      });
    } catch (error: any) {
      console.error("Error adding credits:", error.message);
      toast("Error", {
        description: `Failed to add credits: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.company_name && user.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (role: string) => {
    const statusStyles = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-green-100 text-green-800",
      voter: "bg-blue-100 text-blue-800"
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[role as keyof typeof statusStyles] || "bg-gray-100"}`}>
        {role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (error) {
      return dateString.split('T')[0] || 'Unknown';
    }
  };

  if (!isSuper) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">You don't have permission to access this page.</p>
          <Button className="mt-4 bg-evoting-600 hover:bg-evoting-700 text-white" asChild>
            <a href="/projects">Back to Projects</a>
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
              <BreadcrumbPage>Super Admin Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-600 mt-1">Manage all registered users</p>
          </div>
          
          <Button className="bg-evoting-600 hover:bg-evoting-700 text-white" asChild>
            <Link to="/projects">Back to Projects</Link>
          </Button>
        </div>
        
        <div className="mb-8">
          <SuperAdminRole />
        </div>
        
        <div className="mb-8 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            className="pl-10"
            placeholder="Search users by name, email or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Company</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Meetings</TableHead>
                  <TableHead className="text-right">Add Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.company_name || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(user.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(user.role)}</TableCell>
                    <TableCell className="font-medium">{user.credits || 0}</TableCell>
                    <TableCell>{user.meeting_count || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openAddCreditsDialog(user)}
                        className="text-evoting-600 hover:text-evoting-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No users found matching your search.</p>
          </div>
        )}
      </div>
      
      {/* Add Credits Dialog */}
      {isAddCreditsDialogOpen && selectedUser && (
        <Dialog open={isAddCreditsDialogOpen} onOpenChange={setIsAddCreditsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Credits</DialogTitle>
              <DialogDescription>
                Add credits to {selectedUser.name}'s account ({selectedUser.email})
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <div className="flex justify-between items-center mb-4">
                <Label htmlFor="current-credits">Current Credits:</Label>
                <span className="font-semibold">{selectedUser.credits || 0}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="add-credits">Credits to Add</Label>
                <div className="flex items-center">
                  <IndianRupee className="h-4 w-4 mr-2 text-gray-500" />
                  <Input
                    id="add-credits"
                    type="number"
                    value={creditsToAdd || ''}
                    onChange={(e) => setCreditsToAdd(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  New Balance: <span className="font-semibold">{(selectedUser.credits || 0) + creditsToAdd}</span> credits
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCreditsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCredits} disabled={creditsToAdd <= 0}>
                Add Credits
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SuperAdmin;
