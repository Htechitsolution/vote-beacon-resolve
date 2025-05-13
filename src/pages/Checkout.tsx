
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Navigation from '@/components/layout/Navigation';
import { Check, CreditCard } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Plan {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  features: string[];
}

const Checkout = () => {
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const plans: Plan[] = [
    {
      id: '1',
      name: 'Basic',
      description: 'Perfect for small organizations',
      credits: 10,
      price: 49,
      features: [
        '10 voting credits',
        'Up to 25 voters per meeting',
        'Email support',
        'Basic analytics'
      ]
    },
    {
      id: '2',
      name: 'Standard',
      description: 'Ideal for medium organizations',
      credits: 50,
      price: 149,
      features: [
        '50 voting credits',
        'Up to 100 voters per meeting',
        'Priority email support',
        'Advanced analytics',
        'Custom branding'
      ]
    },
    {
      id: '3',
      name: 'Premium',
      description: 'Perfect for large organizations',
      credits: 100,
      price: 249,
      features: [
        '100 voting credits',
        'Unlimited voters per meeting',
        '24/7 phone support',
        'Premium analytics',
        'Custom branding',
        'API access'
      ]
    }
  ];

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
      
      // Mock payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payment successful!",
        description: "Your credits have been added to your account"
      });
      
      navigate('/projects');
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {plans.map(plan => (
            <Card 
              key={plan.id} 
              className={`border-2 transition-all cursor-pointer ${selectedPlanId === plan.id ? 'border-evoting-600 bg-evoting-50' : 'hover:border-evoting-300'}`}
              onClick={() => handleSelectPlan(plan.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {selectedPlanId === plan.id && (
                    <span className="bg-evoting-100 text-evoting-700 p-1 rounded-full">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </CardTitle>
                <p className="text-gray-600">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline mb-5">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-600 ml-1">/one-time</span>
                </div>
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
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
                Checkout Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
