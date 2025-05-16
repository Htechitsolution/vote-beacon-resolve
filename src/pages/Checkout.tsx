
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Navigation from '@/components/layout/Navigation';
import { CreditCard, IndianRupee } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/contexts/AuthContext";

interface Plan {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  
  // Load script for Razorpay
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // Fetch subscription plans from database
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });
        
      if (error) throw error;
      
      setPlans(data || []);
    } catch (error: any) {
      console.error("Error fetching subscription plans:", error.message);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (id: string) => {
    setSelectedPlanId(id);
  };

  const handleCheckout = async () => {
    if (!selectedPlanId) {
      toast({
        title: "No plan selected", 
        description: "Please select a subscription plan to continue",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setProcessing(true);
      
      // Find the selected plan
      const selectedPlan = plans.find(plan => plan.id === selectedPlanId);
      
      if (!selectedPlan) {
        throw new Error("Selected plan not found");
      }

      // Initialize Razorpay payment
      const options = {
        key: 'rzp_test_YourTestKey', // Replace with your actual Razorpay test key
        amount: selectedPlan.price * 100, // Amount in smallest currency unit (paise)
        currency: "INR",
        name: "The-eVoting",
        description: `${selectedPlan.name} Plan - ${selectedPlan.credits} Credits`,
        image: "https://example.com/your_logo.png",
        handler: function (response: any) {
          // Handle successful payment
          handlePaymentSuccess(selectedPlan, response.razorpay_payment_id);
        },
        prefill: {
          name: profile?.name || "",
          email: profile?.email || "",
        },
        theme: {
          color: "#4f46e5"
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred during payment processing",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (plan: Plan, paymentId: string) => {
    try {
      // In a real implementation, you would verify the payment on your backend
      
      // Update user's credits in the database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          credits: (profile?.credits || 0) + plan.credits,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id);
        
      if (error) throw error;
      
      toast({
        title: "Payment successful!",
        description: `${plan.credits} credits have been added to your account`
      });

      // Redirect to projects page after successful payment
      navigate('/projects');
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Your payment was successful, but we couldn't update your credits. Please contact support.",
        variant: "destructive"
      });
    }
  };

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
              <BreadcrumbPage>Checkout</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Choose a Subscription Plan</h1>
          <p className="text-gray-600 mt-2">Select the plan that best fits your organization's needs</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">No subscription plans available at the moment.</p>
            <Button asChild variant="outline">
              <Link to="/projects">Back to Projects</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              {plans.map(plan => (
                <Card 
                  key={plan.id} 
                  className={`border-2 transition-all ${selectedPlanId === plan.id ? 'border-evoting-600 bg-evoting-50' : 'hover:border-evoting-300'}`}
                >
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <p className="text-gray-600">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline mb-5">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      <span className="text-3xl font-bold">{(plan.price / 100).toLocaleString('en-IN')}</span>
                      <span className="text-gray-600 ml-1">/one-time</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm">{plan.credits} voting credits</span>
                      </div>
                      {plan.name === 'Premium' && (
                        <>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Priority Support</span>
                          </div>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Advanced Analytics</span>
                          </div>
                        </>
                      )}
                      {plan.name === 'Basic' && (
                        <>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Email Support</span>
                          </div>
                        </>
                      )}
                      {plan.name === 'Standard' && (
                        <>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Priority Support</span>
                          </div>
                          <div className="flex items-center">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-sm">Basic Analytics</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className={`w-full ${selectedPlanId === plan.id ? 'bg-evoting-600 hover:bg-evoting-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                      variant={selectedPlanId === plan.id ? 'default' : 'secondary'}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {selectedPlanId === plan.id ? 'Selected' : 'Select Plan'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-center">
              <Button 
                className="bg-evoting-600 hover:bg-evoting-700 text-white min-w-[200px]"
                size="lg"
                onClick={handleCheckout}
                disabled={!selectedPlanId || processing}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Checkout;
