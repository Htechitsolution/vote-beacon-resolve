import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/layout/Navigation';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  Save,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  X,
  Plus,
  PlusCircle,
  RefreshCcw,
  Trash2,
} from 'lucide-react';

type Option = {
  id: string;
  title: string;
  description: string | null;
  required_approval: number;
  file_name?: string | null;
  file_path?: string | null;
};

type Agenda = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  project_id: string;
  voting_type: string;
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  admin_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const AgendaDetail = () => {
  const { projectId, agendaId } = useParams<{ projectId: string; agendaId: string }>();
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionTitle, setNewOptionTitle] = useState('');
  const [newOptionDescription, setNewOptionDescription] = useState('');
  const [newOptionApproval, setNewOptionApproval] = useState(50);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [isDeleteOptionDialogOpen, setIsDeleteOptionDialogOpen] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<string | null>(null);
  
  const [isStartVotingDialogOpen, setIsStartVotingDialogOpen] = useState(false);
  const [votingEndDate, setVotingEndDate] = useState('');
  const [votingEndTime, setVotingEndTime] = useState('');
  
  const [isExtendVotingDialogOpen, setIsExtendVotingDialogOpen] = useState(false);
  
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isClosingVoting, setIsClosingVoting] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (projectId && agendaId) {
      fetchData();
    }
  }, [projectId, agendaId, user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
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
      
      // Fetch options
      const { data: optionsData, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .eq('agenda_id', agendaId);
      
      if (optionsError) throw optionsError;
      setOptions(optionsData || []);
      
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaId) return;
    
    try {
      // Validate input
      if (!newOptionTitle.trim()) {
        toast.error('Title is required');
        return;
      }
      
      let filePath = null;
      let fileName = null;
      
      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        fileName = selectedFile.name;
        const filePath = `${agendaId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('voting-documents')
          .upload(filePath, selectedFile);
          
        if (uploadError) throw uploadError;
      }
      
      // Create new option
      const { data, error } = await supabase
        .from('options')
        .insert([
          {
            title: newOptionTitle,
            description: newOptionDescription || null,
            required_approval: newOptionApproval,
            file_path: filePath,
            file_name: fileName,
            agenda_id: agendaId
          }
        ])
        .select();
        
      if (error) throw error;
      
      if (data) {
        setOptions([...options, ...data]);
        toast.success('Option added successfully');
        
        // Reset form
        setNewOptionTitle('');
        setNewOptionDescription('');
        setNewOptionApproval(50);
        setSelectedFile(null);
        setIsAddingOption(false);
      }
      
    } catch (error: any) {
      console.error('Error adding option:', error.message);
      toast.error('Failed to add option');
    }
  };

  const handleDeleteOption = async () => {
    if (!optionToDelete) return;
    
    try {
      const { error } = await supabase
        .from('options')
        .delete()
        .eq('id', optionToDelete);
        
      if (error) throw error;
      
      setOptions(options.filter(opt => opt.id !== optionToDelete));
      toast.success('Option deleted successfully');
      
    } catch (error: any) {
      console.error('Error deleting option:', error.message);
      toast.error('Failed to delete option');
    } finally {
      setIsDeleteOptionDialogOpen(false);
      setOptionToDelete(null);
    }
  };

  const handleStartVoting = () => {
    // Set default end date as 7 days from now
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 7);
    
    // Format for datetime-local input
    const dateTimeStr = new Date().toISOString().slice(0, 16);
    
    setVotingEndDate(dateTimeStr);
    setIsStartVotingDialogOpen(true);
  };

  const handleConfirmStartVoting = async () => {
    if (!votingEndDate) {
      toast.error('Please select an end date and time');
      return;
    }
    
    try {
      setIsUpdatingStatus(true);
      
      // Parse the datetime input value
      const endDateTime = new Date(votingEndDate);
      
      const { error } = await supabase
        .from('agendas')
        .update({ 
          status: 'live',
          start_date: new Date().toISOString(),
          end_date: endDateTime.toISOString()
        })
        .eq('id', agendaId);
      
      if (error) throw error;
      
      // Update local agenda state with new values
      setAgenda({
        ...agenda!,
        status: 'live',
        start_date: new Date().toISOString(),
        end_date: endDateTime.toISOString()
      });
      
      toast.success('Voting has been started');
      setIsStartVotingDialogOpen(false);
      
    } catch (error: any) {
      console.error('Error starting voting:', error);
      toast.error('Failed to start voting: ' + error.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExtendVoting = () => {
    // Set current end date as default
    if (agenda?.end_date) {
      const endDate = new Date(agenda.end_date);
      // Format for datetime-local input (YYYY-MM-DDThh:mm)
      const dateTimeStr = endDate.toISOString().slice(0, 16);
      setVotingEndDate(dateTimeStr);
    }
    
    setIsExtendVotingDialogOpen(true);
  };

  const handleConfirmExtendVoting = async () => {
    if (!votingEndDate) {
      toast.error('Please select a new end date and time');
      return;
    }
    
    try {
      setIsUpdatingStatus(true);
      
      // Parse the datetime input value
      const endDateTime = new Date(votingEndDate);
      
      // Check if new end date is after current end date
      if (agenda?.end_date && endDateTime <= new Date(agenda.end_date)) {
        toast.error('New end date must be after current end date');
        return;
      }
      
      const { error } = await supabase
        .from('agendas')
        .update({ end_date: endDateTime.toISOString() })
        .eq('id', agendaId);
      
      if (error) throw error;
      
      // Update local agenda state
      setAgenda({
        ...agenda!,
        end_date: endDateTime.toISOString()
      });
      
      toast.success('Voting period has been extended');
      setIsExtendVotingDialogOpen(false);
      
    } catch (error: any) {
      console.error('Error extending voting period:', error);
      toast.error('Failed to extend voting period');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCloseVoting = async () => {
    try {
      setIsClosingVoting(true);
      
      const { error } = await supabase
        .from('agendas')
        .update({ status: 'closed' })
        .eq('id', agendaId);
      
      if (error) throw error;
      
      // Update local agenda state
      setAgenda({
        ...agenda!,
        status: 'closed'
      });
      
      toast.success('Voting has been closed');
      
    } catch (error: any) {
      console.error('Error closing voting:', error);
      toast.error('Failed to close voting');
    } finally {
      setIsClosingVoting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-evoting-600"></div>
      </div>
    );
  }

  if (!agenda || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Navigation />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Meeting Not Found</h1>
          <p className="mb-6">The meeting you are looking for does not exist or has been deleted.</p>
          <Button onClick={() => navigate(`/projects/${projectId}`)}>
            Go Back to Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link to="/">
                <BreadcrumbLink>Home</BreadcrumbLink>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link to="/projects">
                <BreadcrumbLink>Projects</BreadcrumbLink>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link to={`/projects/${projectId}`}>
                <BreadcrumbLink>{project.title}</BreadcrumbLink>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{agenda.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{agenda.title}</h1>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  agenda.status === 'draft' ? 'bg-gray-500' :
                  agenda.status === 'live' ? 'bg-green-500' :
                  'bg-blue-500'
                }
              >
                {agenda.status === 'draft' ? 'Draft' :
                 agenda.status === 'live' ? 'Voting Open' :
                 'Voting Closed'}
              </Badge>
              
              {agenda.status === 'live' && (
                <p className="text-sm text-gray-600">
                  Ends: {formatDate(agenda.end_date)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {agenda.status === 'draft' && (
              <Button 
                onClick={handleStartVoting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Voting
              </Button>
            )}
            
            {agenda.status === 'live' && (
              <>
                <Button 
                  onClick={handleExtendVoting}
                  variant="outline"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Extend Deadline
                </Button>
                
                <Button 
                  onClick={handleCloseVoting}
                  variant="destructive"
                  disabled={isClosingVoting}
                >
                  {isClosingVoting ? (
                    <div className="flex items-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Closing...
                    </div>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Close Voting
                    </>
                  )}
                </Button>
              </>
            )}
            
            {agenda.status === 'closed' && (
              <Button 
                onClick={() => navigate(`/projects/${projectId}/agenda/${agendaId}/results`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                View Results
              </Button>
            )}
          </div>
        </div>
        
        {agenda.description && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="whitespace-pre-line">{agenda.description}</p>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="options" className="mb-8">
          <TabsList>
            <TabsTrigger value="options">Agenda Items</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="options" className="mt-6">
            {agenda.status === 'draft' && (
              <Button 
                className="mb-6 bg-evoting-600 hover:bg-evoting-700 text-white"
                onClick={() => setIsAddingOption(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            )}
            
            {options.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Items Yet</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  This meeting doesn't have any agenda items yet.
                  {agenda.status === 'draft' && " Click the 'Add Item' button above to add your first item."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {options.map((option) => (
                  <Card key={option.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{option.title}</CardTitle>
                          <CardDescription>
                            Required Approval: {option.required_approval}%
                          </CardDescription>
                        </div>
                        
                        {agenda.status === 'draft' && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setOptionToDelete(option.id);
                              setIsDeleteOptionDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {option.description && (
                        <p className="mb-4 whitespace-pre-line">{option.description}</p>
                      )}
                      
                      {option.file_path && option.file_name && (
                        <Button variant="outline" size="sm" className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          {option.file_name}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Settings</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <p className="text-gray-700">
                    {agenda.status === 'draft' ? 'Draft - Not yet open for voting' :
                     agenda.status === 'live' ? 'Live - Voting is ongoing' :
                     'Closed - Voting has ended'}
                  </p>
                </div>
                
                {agenda.start_date && (
                  <div>
                    <Label className="text-sm font-semibold">Started On</Label>
                    <p className="text-gray-700">{formatDate(agenda.start_date)}</p>
                  </div>
                )}
                
                {agenda.end_date && (
                  <div>
                    <Label className="text-sm font-semibold">Ends On</Label>
                    <p className="text-gray-700">{formatDate(agenda.end_date)}</p>
                  </div>
                )}
                
                <Separator />
                
                <div>
                  <Label className="text-sm font-semibold">Created</Label>
                  <p className="text-gray-700">{formatDate(agenda.created_at)}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Last Updated</Label>
                  <p className="text-gray-700">{formatDate(agenda.updated_at)}</p>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/projects/${projectId}/voters`)}
                  className="w-full"
                >
                  Manage Voters
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Option Dialog */}
      <Dialog open={isAddingOption} onOpenChange={setIsAddingOption}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Agenda Item</DialogTitle>
            <DialogDescription>
              Add a new item to be voted on in this meeting.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddOption} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newOptionTitle}
                onChange={(e) => setNewOptionTitle(e.target.value)}
                placeholder="Enter item title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newOptionDescription}
                onChange={(e) => setNewOptionDescription(e.target.value)}
                placeholder="Enter item description"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="approval">Required Approval Percentage</Label>
              <Input
                id="approval"
                type="number"
                min="1"
                max="100"
                value={newOptionApproval}
                onChange={(e) => setNewOptionApproval(parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500">
                Percentage of votes required for this item to be approved
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document">Attach Document (Optional)</Label>
              <Input
                id="document"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Upload supporting documents for this agenda item
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddingOption(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Option Confirmation */}
      <AlertDialog open={isDeleteOptionDialogOpen} onOpenChange={setIsDeleteOptionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agenda Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agenda item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOption} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Start Voting Dialog */}
      <Dialog open={isStartVotingDialogOpen} onOpenChange={setIsStartVotingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Voting</DialogTitle>
            <DialogDescription>
              Once started, voters will be able to cast their votes until the specified end date and time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="endDateTime">Voting End Date and Time</Label>
              <Input
                id="endDateTime"
                type="datetime-local"
                value={votingEndDate}
                onChange={(e) => setVotingEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsStartVotingDialogOpen(false)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmStartVoting}
              disabled={isUpdatingStatus}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdatingStatus ? (
                <div className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Starting...
                </div>
              ) : (
                <>Start Voting</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Extend Voting Dialog */}
      <Dialog open={isExtendVotingDialogOpen} onOpenChange={setIsExtendVotingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Voting Period</DialogTitle>
            <DialogDescription>
              Set a new end date and time for voting. The new date must be after the current deadline.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-semibold">Current End Date & Time</Label>
              <p className="text-gray-700">{formatDate(agenda?.end_date)}</p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="extendDateTime">New End Date and Time</Label>
              <Input
                id="extendDateTime"
                type="datetime-local"
                value={votingEndDate}
                onChange={(e) => setVotingEndDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsExtendVotingDialogOpen(false)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmExtendVoting}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <div className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Extending...
                </div>
              ) : (
                <>Extend Voting</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaDetail;
