
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { generateOTP } from '@/lib/utils';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string, role: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, companyName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isSuper: boolean;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  pendingVoterEmail: string | null;
  initiateVoterLogin: (email: string) => Promise<void>;
  verifyVoterOTP: (otp: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVoterEmail, setPendingVoterEmail] = useState<string | null>(null);
  const [pendingVoterOTP, setPendingVoterOTP] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid calling Supabase directly in the callback
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? "Logged in" : "Not logged in");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      console.log("Profile fetched:", data);
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      setProfile(null);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh profile data
      fetchProfile(user.id);
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string, role: string) => {
    try {
      setIsLoading(true);
      // Clear any existing session first to prevent conflicts
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      // For admin login only
      toast.success('Signed in successfully!');
      navigate('/projects');
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, companyName: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name,
            company_name: companyName,
          }
        }
      });
      
      if (error) throw error;
      
      toast.success('Account created successfully! You can now sign in.');
      navigate('/login');
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      
      if (error) throw error;
      
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Error resetting password:', error.message);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Clear voter session data
      setPendingVoterEmail(null);
      setPendingVoterOTP(null);
      
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      toast.error(error.message || 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  // Simplified Voter OTP login methods for testing
  const initiateVoterLogin = async (email: string) => {
    try {
      setIsLoading(true);
      
      // For testing purposes, allow any email and generate OTP
      const otp = generateOTP();
      setPendingVoterEmail(email);
      setPendingVoterOTP(otp);
      
      // Log the OTP to console for testing
      console.log('========== VOTER LOGIN OTP ==========');
      console.log(`Email: ${email.toLowerCase()}`);
      console.log(`OTP: ${otp}`);
      console.log('====================================');
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return;
      
    } catch (error: any) {
      console.error('Error initiating voter login:', error);
      setPendingVoterEmail(null);
      setPendingVoterOTP(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyVoterOTP = async (enteredOTP: string): Promise<boolean> => {
    if (!pendingVoterEmail || !pendingVoterOTP) return false;
    
    try {
      setIsLoading(true);
      
      // For testing - allow direct match with stored OTP
      if (enteredOTP === pendingVoterOTP) {
        // Create a temporary voter profile without using Supabase auth
        const tempVoterProfile: Profile = {
          id: crypto.randomUUID(),
          email: pendingVoterEmail,
          name: 'Voter',
          company_name: null,
          role: 'voter' as any,
          subscription_plan: null,
          credits: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Set the voter profile
        setProfile(tempVoterProfile);
        
        // Create a temporary user object
        const tempUser = {
          id: tempVoterProfile.id,
          email: pendingVoterEmail,
          aud: 'authenticated',
          role: 'authenticated',
          email_confirmed_at: new Date().toISOString(),
          phone: '',
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User;
        
        setUser(tempUser);
        
        // Clear pending data
        setPendingVoterEmail(null);
        setPendingVoterOTP(null);
        
        return true;
      }
      
      // If we got here, OTP didn't match
      return false;
      
    } catch (error: any) {
      console.error('Error verifying voter OTP:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isSuper = profile?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile,
      isLoading, 
      signIn, 
      signUp, 
      signOut,
      isSuper,
      resetPassword,
      updateProfile,
      pendingVoterEmail,
      initiateVoterLogin,
      verifyVoterOTP
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
