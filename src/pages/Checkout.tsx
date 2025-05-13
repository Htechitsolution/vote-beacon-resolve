
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import Navigation from '@/components/layout/Navigation';
import { Check, CreditCard, Edit, Trash2, IndianRupee } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: '1',
      name: 'Basic',
      description: 'Perfect for small organizations',
      credits: 10,
      price: 2999,
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
      price: 7999,
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
      price: 14999,
      features: [
        '100 voting credits',
        'Unlimited voters per meeting',
        '24/7 phone support',
        'Premium analytics',
        'Custom branding',
        'API access'
      ]
    }
  ]);
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'super_admin';

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
      
      // Find the selected plan
      const selectedPlan = plans.find(plan => plan.id === selectedPlanId);
      
      if (selectedPlan) {
        // In a real implementation, you would update the user's credits in the database
        // For now, we'll just show a success message
        toast({
          title: "Payment successful!",
          description: `${selectedPlan.credits} credits have been added to your account`
        });
      }
      
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

  const handleEditPlan = (plan: Plan) => {
    setCurrentPlan(plan);
    setIsEditDialogOpen(true);
  };

  const handleDeletePlan = (plan: Plan) => {
    setCurrentPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (!currentPlan) return;
    
    const updatedPlans = plans.map(p => 
      p.id === currentPlan.id ? currentPlan : p
    );
    
    setPlans(updatedPlans);
    setIsEditDialogOpen(false);
    toast({
      title: "Success",
      description: "Plan updated successfully"
    });
  };

  const handleConfirmDelete = () => {
    if (!currentPlan) return;
    
    const filteredPlans = plans.filter(p => p.id !== currentPlan.id);
    setPlans(filteredPlans);
    setIsDeleteDialogOpen(false);
    
    // If the deleted plan was selected, clear the selection
    if (selectedPlanId === currentPlan.id) {
      setSelectedPlanId(null);
    }
    
    toast({
      title: "Success",
      description: "Plan deleted successfully"
    });
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
              className={`border-2 transition-all ${selectedPlanId === plan.id ? 'border-evoting-600 bg-evoting-50' : 'hover:border-evoting-300'}`}
            >
              <CardHeader className="relative">
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {selectedPlanId === plan.id && (
                    <span className="bg-evoting-100 text-evoting-700 p-1 rounded-full">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </CardTitle>
                <p className="text-gray-600">{plan.description}</p>
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPlan(plan);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(plan);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline mb-5">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  <span className="text-3xl font-bold">{(plan.price / 100).toLocaleString('en-IN')}</span>
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

      {/* Edit Plan Dialog */}
      {isEditDialogOpen && currentPlan && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
              <DialogDescription>
                Update the details of this subscription plan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={currentPlan.name}
                  onChange={(e) => setCurrentPlan({...currentPlan, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={currentPlan.description}
                  onChange={(e) => setCurrentPlan({...currentPlan, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price (₹)
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={currentPlan.price / 100}
                  onChange={(e) => setCurrentPlan({...currentPlan, price: Math.round(parseFloat(e.target.value) * 100)})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credits" className="text-right">
                  Credits
                </Label>
                <Input
                  id="credits"
                  type="number"
                  value={currentPlan.credits}
                  onChange={(e) => setCurrentPlan({...currentPlan, credits: parseInt(e.target.value)})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePlan}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Plan Confirmation */}
      {isDeleteDialogOpen && currentPlan && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Plan</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the {currentPlan.name} plan? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Checkout;
