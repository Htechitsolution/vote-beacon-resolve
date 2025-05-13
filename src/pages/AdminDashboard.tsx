
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/layout/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, User, FileText, CheckSquare, IndianRupee, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Stats {
  totalUsers: number;
  totalProjects: number;
  liveProjects: number;
  totalMeetings: number;
  liveMeetings: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  credits: number;
  created_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProjects: 0,
    liveProjects: 0,
    totalMeetings: 0,
    liveMeetings: 0,
  });
  const [plans, setPlans] = useState<SubscriptionPlan[]>([
    { id: "1", name: "Basic Plan", description: "10 credits", price: 2999, credits: 10 },
    { id: "2", name: "Standard Plan", description: "50 credits", price: 7999, credits: 50 },
    { id: "3", name: "Premium Plan", description: "100 credits", price: 14999, credits: 100 },
  ]);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: 0,
    credits: 0,
  });
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const { isSuper } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*');

      if (userError) throw userError;
      
      setUsers(userData || []);
      
      // Fetch projects stats
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      
      if (projectsError) throw projectsError;
      
      // Fetch agenda/meetings stats
      const { data: agendasData, error: agendasError } = await supabase
        .from('agendas')
        .select('*');
        
      if (agendasError) throw agendasError;
      
      // Calculate stats
      setStats({
        totalUsers: userData.length,
        totalProjects: projectsData.length,
        liveProjects: projectsData.filter(p => p.status === 'live').length,
        totalMeetings: agendasData.length,
        liveMeetings: agendasData.filter(a => a.status === 'live').length,
      });
      
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = () => {
    if (!newPlan.name || !newPlan.description || newPlan.price <= 0 || newPlan.credits <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all plan details",
        variant: "destructive"
      });
      return;
    }
    
    const newId = String(plans.length + 1);
    setPlans([...plans, { ...newPlan, id: newId }]);
    setNewPlan({ name: "", description: "", price: 0, credits: 0 });
    setIsAddingPlan(false);
    
    toast({
      title: "Success",
      description: "Subscription plan added successfully"
    });
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    setIsEditingPlan(true);
  };

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    setIsDeletingPlan(true);
  };

  const handleUpdatePlan = () => {
    if (!currentPlan) return;
    
    const updatedPlans = plans.map(p => 
      p.id === currentPlan.id ? currentPlan : p
    );
    
    setPlans(updatedPlans);
    setIsEditingPlan(false);
    toast({
      title: "Success",
      description: "Plan updated successfully"
    });
  };

  const handleConfirmDelete = () => {
    if (!currentPlan) return;
    
    const filteredPlans = plans.filter(p => p.id !== currentPlan.id);
    setPlans(filteredPlans);
    setIsDeletingPlan(false);
    
    toast({
      title: "Success",
      description: "Plan deleted successfully"
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.company_name && user.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (!isSuper) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">You don't have permission to access this page.</p>
          <Button className="mt-4 bg-evoting-600 hover:bg-evoting-700 text-white" asChild>
            <Link to="/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage users, projects, and subscription plans</p>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                <span className="text-3xl font-bold">{stats.totalUsers}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-600">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-green-600" />
                <span className="text-3xl font-bold">{stats.totalProjects}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-600">Live Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckSquare className="mr-2 h-5 w-5 text-purple-600" />
                <span className="text-3xl font-bold">{stats.liveProjects}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-600">Total Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <User className="mr-2 h-5 w-5 text-amber-600" />
                <span className="text-3xl font-bold">{stats.totalMeetings}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-600">Live Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <CheckSquare className="mr-2 h-5 w-5 text-red-600" />
                <span className="text-3xl font-bold">{stats.liveMeetings}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Subscription Plans */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Subscription Plans</h2>
            <Button 
              className="bg-evoting-600 hover:bg-evoting-700" 
              onClick={() => setIsAddingPlan(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Plan
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-2 hover:border-evoting-600 transition-all">
                <CardHeader className="relative">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500"
                      onClick={() => handleDeletePlan(plan)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      <span className="text-3xl font-bold">{(plan.price / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <span className="bg-evoting-50 text-evoting-700 px-3 py-1 rounded-full text-sm font-medium">
                      {plan.credits} credits
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Add Plan Dialog */}
          {isAddingPlan && (
            <Dialog open={isAddingPlan} onOpenChange={setIsAddingPlan}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Create a new subscription plan for your customers
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan-name">Plan Name</Label>
                    <Input 
                      id="plan-name"
                      value={newPlan.name} 
                      onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                      placeholder="e.g. Premium Plan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-description">Description</Label>
                    <Input 
                      id="plan-description"
                      value={newPlan.description} 
                      onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                      placeholder="e.g. 100 credits"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-price">Price (₹)</Label>
                    <Input 
                      id="plan-price"
                      type="number" 
                      value={newPlan.price / 100} 
                      onChange={(e) => setNewPlan({...newPlan, price: Math.round(parseFloat(e.target.value) * 100)})}
                      placeholder="e.g. 999.99"
                    />
                    <p className="text-xs text-gray-500">Enter the price in INR (Indian Rupees)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan-credits">Credits</Label>
                    <Input 
                      id="plan-credits"
                      type="number" 
                      value={newPlan.credits} 
                      onChange={(e) => setNewPlan({...newPlan, credits: parseInt(e.target.value)})}
                      placeholder="e.g. 100"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingPlan(false)}>Cancel</Button>
                  <Button className="bg-evoting-600 hover:bg-evoting-700" onClick={handleAddPlan}>Save Plan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Edit Plan Dialog */}
          {isEditingPlan && currentPlan && (
            <Dialog open={isEditingPlan} onOpenChange={setIsEditingPlan}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Update the details of this subscription plan
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-plan-name">Plan Name</Label>
                    <Input 
                      id="edit-plan-name"
                      value={currentPlan.name} 
                      onChange={(e) => setCurrentPlan({...currentPlan, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-plan-description">Description</Label>
                    <Input 
                      id="edit-plan-description"
                      value={currentPlan.description} 
                      onChange={(e) => setCurrentPlan({...currentPlan, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-plan-price">Price (₹)</Label>
                    <Input 
                      id="edit-plan-price"
                      type="number" 
                      value={currentPlan.price / 100} 
                      onChange={(e) => setCurrentPlan({...currentPlan, price: Math.round(parseFloat(e.target.value) * 100)})}
                    />
                    <p className="text-xs text-gray-500">Enter the price in INR (Indian Rupees)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-plan-credits">Credits</Label>
                    <Input 
                      id="edit-plan-credits"
                      type="number" 
                      value={currentPlan.credits} 
                      onChange={(e) => setCurrentPlan({...currentPlan, credits: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditingPlan(false)}>Cancel</Button>
                  <Button onClick={handleUpdatePlan}>Update Plan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Delete Plan Dialog */}
          {isDeletingPlan && currentPlan && (
            <Dialog open={isDeletingPlan} onOpenChange={setIsDeletingPlan}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete Plan</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the {currentPlan.name} plan? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsDeletingPlan(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* User Management */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">User Management</h2>
          
          <div className="mb-6 relative">
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
                    <TableHead>Credits</TableHead>
                    <TableHead>Add Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{user.company_name || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center">
                          <IndianRupee className="mr-1 h-4 w-4 text-gray-400" />
                          {user.credits || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate('/super-admin')}
                          className="text-evoting-600 hover:bg-evoting-50"
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
      </div>
    </div>
  );
};

export default AdminDashboard;
