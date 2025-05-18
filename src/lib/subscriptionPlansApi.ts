
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  validity_days?: number | null; // Optional validity in days
}

// Get all subscription plans
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*');
    
  if (error) {
    console.error("Error fetching subscription plans:", error);
    throw new Error(error.message);
  }
  
  return data || [];
};

// Create a new subscription plan
export const createSubscriptionPlan = async (plan: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert([plan])
    .select()
    .single();
    
  if (error) {
    console.error("Error creating subscription plan:", error);
    throw new Error(error.message);
  }
  
  return data;
};

// Update an existing subscription plan
export const updateSubscriptionPlan = async (id: string, updates: Partial<Omit<SubscriptionPlan, 'id'>>): Promise<SubscriptionPlan> => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating subscription plan:", error);
    throw new Error(error.message);
  }
  
  return data;
};

// Delete a subscription plan
export const deleteSubscriptionPlan = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('subscription_plans')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error("Error deleting subscription plan:", error);
    throw new Error(error.message);
  }
};
