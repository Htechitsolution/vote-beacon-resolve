import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCompanyName(profile.company_name || '');
    }
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ name, company_name: companyName });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Button asChild variant="outline" className="mb-6">
          <Link to="/projects" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="flex flex-col items-center space-y-2">
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.id}`} alt={name} />
              <AvatarFallback>{name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-bold">{name || 'User Profile'}</CardTitle>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-right text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                readOnly
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="name" className="text-right text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your full name"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="companyName" className="text-right text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your company name"
              />
            </div>
            <Button className="w-full" onClick={handleUpdateProfile} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Update Profile'}
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
