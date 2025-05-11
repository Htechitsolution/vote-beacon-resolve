
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
import { toast } from "sonner";

type Profile = {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  role: "super_admin" | "admin" | "voter";
  created_at: string;
  updated_at: string;
};

const SuperAdmin = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSuper } = useAuth();
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error.message);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all registered users</p>
        </div>
        
        <Button className="bg-evoting-600 hover:bg-evoting-700 text-white" asChild>
          <a href="/projects">Back to Projects</a>
        </Button>
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
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">View</Button>
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
  );
};

export default SuperAdmin;
