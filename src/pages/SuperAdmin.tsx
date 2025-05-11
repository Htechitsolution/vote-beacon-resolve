
import React, { useState } from "react";
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

// This would be fetched from Supabase once integrated
const dummyUsers = [
  {
    id: "1",
    name: "John Smith",
    email: "john@example.com",
    companyName: "Smith Consultants",
    role: "admin",
    createdAt: "2025-04-01",
    status: "active"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    companyName: "Johnson & Associates",
    role: "admin",
    createdAt: "2025-04-05",
    status: "active"
  },
  {
    id: "3",
    name: "Michael Brown",
    email: "michael@example.com",
    companyName: "Brown Resolution Services",
    role: "admin",
    createdAt: "2025-04-10",
    status: "inactive"
  },
  {
    id: "4",
    name: "Lisa Davis",
    email: "lisa@example.com",
    companyName: "Davis Consulting",
    role: "admin",
    createdAt: "2025-04-15",
    status: "active"
  },
  {
    id: "5",
    name: "Robert Wilson",
    email: "robert@example.com",
    companyName: "Wilson & Partners",
    role: "admin",
    createdAt: "2025-04-20",
    status: "pending"
  }
];

const SuperAdmin = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredUsers = dummyUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800"
    };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[status as keyof typeof statusStyles] || "bg-gray-100"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="hidden md:table-cell">{user.companyName}</TableCell>
                <TableCell className="hidden md:table-cell">{user.createdAt}</TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No users found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;
