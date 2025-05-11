
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const SuperAdminRole = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const makeSuperAdmin = async () => {
    try {
      setLoading(true);

      if (!email) {
        toast.error("Please enter an email address");
        return;
      }

      // First, find the user's profile by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        toast.error("No user found with this email address");
        return;
      }

      // Update the user's role to super_admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', profiles[0].id);

      if (updateError) throw updateError;

      toast.success(`User ${email} has been granted super admin rights`);
      setEmail("");
      
    } catch (error: any) {
      console.error("Error updating user role:", error.message);
      toast.error(error.message || "Failed to update user role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grant Super Admin Rights</CardTitle>
        <CardDescription>
          Make an existing user a super administrator by entering their email address.
          Super admins have full access to all projects and users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Enter user email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={makeSuperAdmin} 
            disabled={loading}
            className="bg-evoting-600 hover:bg-evoting-700 text-white"
          >
            {loading ? "Processing..." : "Grant Access"}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        Note: The user must already have an account in the system.
      </CardFooter>
    </Card>
  );
};

export default SuperAdminRole;
