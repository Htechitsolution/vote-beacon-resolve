
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SubscriptionPlan } from "@/lib/subscriptionPlansApi";

// Form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  price: z.coerce.number().positive({ message: "Price must be a positive number" }),
  credits: z.coerce.number().positive({ message: "Credits must be a positive number" }),
  hasValidity: z.boolean().default(false),
  validity_days: z.coerce.number().nullable().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SubscriptionPlanFormProps {
  initialData?: Partial<SubscriptionPlan>;
  onSubmit: (data: Omit<SubscriptionPlan, 'id'>) => Promise<void>;
  isSubmitting: boolean;
}

const SubscriptionPlanForm = ({ initialData, onSubmit, isSubmitting }: SubscriptionPlanFormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      credits: initialData?.credits || 0,
      hasValidity: initialData?.validity_days ? true : false,
      validity_days: initialData?.validity_days || null,
    },
  });

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      name: data.name,
      description: data.description,
      price: data.price,
      credits: data.credits,
      validity_days: data.hasValidity ? data.validity_days : null,
    });
  };

  // Watch hasValidity to conditionally display validity_days field
  const hasValidity = form.watch("hasValidity");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan Name</FormLabel>
              <FormControl>
                <Input placeholder="Basic Plan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter plan description" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (INR)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="credits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credits</FormLabel>
                <FormControl>
                  <Input type="number" min="1" step="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="hasValidity"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set Validity Period</FormLabel>
                <FormDescription>
                  Credits will expire after the validity period
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        {hasValidity && (
          <FormField
            control={form.control}
            name="validity_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validity (Days)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    step="1" 
                    placeholder="365" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Number of days before credits expire
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Save Plan"}
        </Button>
      </form>
    </Form>
  );
};

export default SubscriptionPlanForm;
