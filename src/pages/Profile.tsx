
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Building, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navigation from "@/components/layout/Navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company_name: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Profile = () => {
  const { user, profile, isSuper } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
      company_name: profile?.company_name || "",
    },
  });

  // Update form values when profile changes
  useEffect(() => {
    if (profile) {
      form.setValue("name", profile.name);
      form.setValue("company_name", profile.company_name || "");
    }
  }, [profile, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          company_name: values.company_name || null,
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };
  
  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        
        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail size={16} className="text-gray-500" />
                    <span>{user.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Role</label>
                  <div className="mt-1">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium capitalize">
                      {profile.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Member Since</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar size={16} className="text-gray-500" />
                    <span>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Company Name (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="bg-evoting-600 hover:bg-evoting-700 text-white"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
