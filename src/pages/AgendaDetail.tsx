
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Upload, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Navigation from "@/components/layout/Navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

type Agenda = {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  voting_type: string;
  created_at: string;
};

type Project = {
  id: string;
  title: string;
};

type Option = {
  id: string;
  title: string;
  description: string | null;
  agenda_id: string;
};

// Form schema for adding agenda
const agendaFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

// Form schema for starting voting
const startVotingFormSchema = z.object({
  end_date: z.date({
    required_error: "End date is required",
  }),
  approval_percentage: z
    .number()
    .min(1, "Minimum approval percentage is 1%")
    .max(100, "Maximum approval percentage is 100%")
    .default(50),
});

type AgendaFormValues = z.infer<typeof agendaFormSchema>;
type StartVotingFormValues = z.infer<typeof startVotingFormSchema>;

const AgendaDetail = () => {
  const { projectId, agendaId } = useParams<{ projectId: string, agendaId: string }>();
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAgendaDialogOpen, setAddAgendaDialogOpen] = useState(false);
  const [startVotingDialogOpen, setStartVotingDialogOpen] = useState(false);
  const { user, profile } = useAuth();

  const agendaForm = useForm<AgendaFormValues>({
    resolver: zodResolver(agendaFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });
  
  const votingForm = useForm<StartVotingFormValues>({
    resolver: zodResolver(startVotingFormSchema),
    defaultValues: {
      approval_percentage: 50,
    },
  });

  useEffect(() => {
    if (projectId && agendaId) {
      fetchProjectAndAgenda();
      fetchOptions();
    }
  }, [projectId, agendaId]);

  const fetchProjectAndAgenda = async () => {
    try {
      setLoading(true);
      
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, title')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch agenda
      const { data: agendaData, error: agendaError } = await supabase
        .from('agendas')
        .select('*')
        .eq('id', agendaId)
        .single();

      if (agendaError) throw agendaError;
      setAgenda(agendaData);
      
    } catch (error: any) {
      console.error("Error fetching agenda details:", error.message);
      toast.error("Failed to load agenda details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('options')
        .select('*')
        .eq('agenda_id', agendaId);

      if (error) throw error;
      setOptions(data || []);
      
    } catch (error: any) {
      console.error("Error fetching options:", error.message);
      toast.error("Failed to load voting options");
    }
  };
  
  const handleAddAgenda = async (values: AgendaFormValues) => {
    try {
      if (!agendaId) return;
      
      const { data, error } = await supabase
        .from('options')
        .insert([
          { 
            title: values.title,
            description: values.description || null,
            agenda_id: agendaId
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast.success("Option added successfully!");
      setAddAgendaDialogOpen(false);
      agendaForm.reset();
      fetchOptions();
    } catch (error: any) {
      console.error("Error adding option:", error.message);
      toast.error(error.message || "Failed to add option");
    }
  };
  
  const handleStartVoting = async (values: StartVotingFormValues) => {
    try {
      if (!agendaId) return;
      
      const { error } = await supabase
        .from('agendas')
        .update({
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: values.end_date.toISOString(),
        })
        .eq('id', agendaId);

      if (error) throw error;
      
      toast.success("Voting started successfully!");
      setStartVotingDialogOpen(false);
      fetchProjectAndAgenda();
    } catch (error: any) {
      console.error("Error starting voting:", error.message);
      toast.error(error.message || "Failed to start voting");
    }
  };
  
  const handleExtendEndDate = async () => {
    try {
      if (!agendaId || !agenda?.end_date) return;
      
      // Add one day to the current end date
      const currentEndDate = new Date(agenda.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      
      const { error } = await supabase
        .from('agendas')
        .update({
          end_date: newEndDate.toISOString(),
        })
        .eq('id', agendaId);

      if (error) throw error;
      
      toast.success("Voting period extended by 24 hours");
      fetchProjectAndAgenda();
    } catch (error: any) {
      console.error("Error extending voting period:", error.message);
      toast.error(error.message || "Failed to extend voting period");
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMMM d, yyyy - h:mm a');
  };

  const isActive = agenda?.status === 'active' && 
    agenda?.end_date && new Date(agenda.end_date) > new Date();
  
  const isVotingNotStarted = agenda?.status === 'draft';
  
  const canAddOptions = isVotingNotStarted;

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!agenda || !project) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Agenda Not Found</h1>
          <p className="mt-2">The voting agenda you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button className="mt-4" asChild>
            <Link to={`/projects/${projectId}`}>Back to Project</Link>
          </Button>
        </div>
      </div>
    );
  }

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
              <BreadcrumbLink>
                <Link to={`/projects/${projectId}`}>{project.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{agenda.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{agenda.title}</h1>
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isActive ? 'Active' : isVotingNotStarted ? 'Draft' : 'Closed'}
                </span>
              </div>
              
              <p className="text-gray-600 mb-2">{agenda.description || "No description provided."}</p>
              
              {profile && (
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium capitalize">
                  {profile.role.replace('_', ' ')}
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {isVotingNotStarted ? (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={options.length === 0}
                  onClick={() => setStartVotingDialogOpen(true)}
                >
                  Start Voting
                </Button>
              ) : isActive ? (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleExtendEndDate}
                >
                  Extend Voting Period
                </Button>
              ) : null}
              
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Voting Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Start:</span>
                    <span className="ml-2 font-medium">{formatDateTime(agenda.start_date)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">End:</span>
                    <span className="ml-2 font-medium">{formatDateTime(agenda.end_date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Voting Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium capitalize">
                  {agenda.voting_type.replace('_', ' ')}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Voting Options</h2>
              {canAddOptions && (
                <Button
                  className="bg-evoting-600 hover:bg-evoting-700 text-white text-sm"
                  onClick={() => setAddAgendaDialogOpen(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>
            
            {options.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-2">No voting options have been added yet.</p>
                {canAddOptions && (
                  <Button 
                    className="bg-evoting-600 hover:bg-evoting-700 text-white"
                    onClick={() => setAddAgendaDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Option
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option) => (
                  <Card key={option.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{option.description || "No description"}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Voters</h2>
              <Button
                variant="outline"
                className="text-sm"
                asChild
              >
                <Link to={`/projects/${projectId}/agenda/${agendaId}/voters`}>
                  Manage Voters
                </Link>
              </Button>
            </div>
            
            <Card>
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600">Manage voters and view voting results</p>
                  </div>
                  <Button asChild>
                    <Link to={`/projects/${projectId}/agenda/${agendaId}/results`}>
                      View Results
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Add Option Dialog */}
        <Dialog open={addAgendaDialogOpen} onOpenChange={setAddAgendaDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Voting Option</DialogTitle>
              <DialogDescription>
                Add a new option for voters to select.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...agendaForm}>
              <form onSubmit={agendaForm.handleSubmit(handleAddAgenda)} className="space-y-4">
                <FormField
                  control={agendaForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter option title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={agendaForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter option description..." 
                          {...field} 
                          value={field.value || ""}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddAgendaDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-evoting-600 hover:bg-evoting-700 text-white">
                    Add Option
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Start Voting Dialog */}
        <Dialog open={startVotingDialogOpen} onOpenChange={setStartVotingDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Start Voting</DialogTitle>
              <DialogDescription>
                Set the parameters for this voting session.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...votingForm}>
              <form onSubmit={votingForm.handleSubmit(handleStartVoting)} className="space-y-4">
                <FormField
                  control={votingForm.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Voting End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            className="pointer-events-auto" // Add this to fix the date picker
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={votingForm.control}
                  name="approval_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Approval Percentage (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number" 
                          min={1} 
                          max={100}
                          placeholder="50"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setStartVotingDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={options.length === 0}
                  >
                    Start Voting
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AgendaDetail;
