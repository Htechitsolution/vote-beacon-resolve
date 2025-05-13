
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  ArrowLeft, 
  Users, 
  Vote, 
  Check, 
  Clock, 
  ChartBar, 
  X, 
  Calendar,
  Upload,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Navigation from "@/components/layout/Navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  status: string;
};

type Option = {
  id: string;
  title: string;
  description: string | null;
  agenda_id: string;
  file_path?: string | null;
  file_name?: string | null;
};

type Voter = {
  id: string;
  name: string;
  email: string;
  company_name?: string | null;
  voting_weight: number;
  status: string;
};

const AgendaDetail = () => {
  const { projectId, agendaId } = useParams<{ projectId: string; agendaId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [isAdmin, setIsAdmin] = useState(false);

  // New state variables for adding options and confirmation dialogs
  const [isAddOptionDialogOpen, setIsAddOptionDialogOpen] = useState(false);
  const [newOptionTitle, setNewOptionTitle] = useState("");
  const [newOptionDescription, setNewOptionDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isStartVotingDialogOpen, setIsStartVotingDialogOpen] = useState(false);
  const [isExtendEndDateDialogOpen, setIsExtendEndDateDialogOpen] = useState(false);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (projectId && agendaId) {
      fetchData();
    }
  }, [projectId, agendaId]);

  useEffect(() => {
    if (profile) {
      setIsAdmin(profile.role === 'admin' || profile.role === 'super_admin');
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, title, status')
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

      // Fetch voters
      const { data: votersData, error: votersError } = await supabase
        .from('voters')
        .select('*')
        .eq('project_id', projectId);

      if (votersError) throw votersError;
      setVoters(votersData || []);
      
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      toast.error("Failed to load agenda details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('voting-documents')
        .download(filePath);
      
      if (error) throw error;
      
      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (error: any) {
      console.error("Error downloading file:", error.message);
      toast.error("Failed to download file");
    }
  };

  const handleStartVoting = () => {
    setIsStartVotingDialogOpen(true);
  };

  const confirmStartVoting = async () => {
    try {
      if (!selectedEndDate) {
        toast.error("Please select an end date");
        return;
      }
      
      const { error } = await supabase
        .from('agendas')
        .update({ 
          status: 'live', 
          start_date: new Date().toISOString(),
          end_date: selectedEndDate.toISOString()
        })
        .eq('id', agendaId);
        
      if (error) throw error;
      
      toast.success("Voting has been started");
      setIsStartVotingDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error starting voting:", error.message);
      toast.error("Failed to start voting");
    }
  };

  const handleExtendEndDate = () => {
    setIsExtendEndDateDialogOpen(true);
  };

  const confirmExtendEndDate = async () => {
    try {
      if (!selectedEndDate) {
        toast.error("Please select a new end date");
        return;
      }
      
      const { error } = await supabase
        .from('agendas')
        .update({ end_date: selectedEndDate.toISOString() })
        .eq('id', agendaId);
        
      if (error) throw error;
      
      toast.success("End date has been extended");
      setIsExtendEndDateDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error extending end date:", error.message);
      toast.error("Failed to extend end date");
    }
  };

  const handleCloseVoting = async () => {
    try {
      const { error } = await supabase
        .from('agendas')
        .update({ status: 'closed', end_date: new Date().toISOString() })
        .eq('id', agendaId);
        
      if (error) throw error;
      
      toast.success("Voting has been closed");
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error closing voting:", error.message);
      toast.error("Failed to close voting");
    }
  };

  const handleAddOption = () => {
    setIsAddOptionDialogOpen(true);
    setNewOptionTitle("");
    setNewOptionDescription("");
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size cannot exceed 5MB");
        return;
      }
      
      // Check file type
      const allowedTypes = [
        'application/pdf', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, Word, Excel, PowerPoint, or ZIP files are allowed");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmitOption = async () => {
    try {
      setIsUploading(true);
      
      if (!newOptionTitle) {
        toast.error("Option title is required");
        setIsUploading(false);
        return;
      }
      
      let filePath = null;
      let fileName = null;
      
      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileKey = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const storagePath = `options/${fileKey}`;
        
        const { error: uploadError } = await supabase.storage
          .from('voting-documents')
          .upload(storagePath, selectedFile);
        
        if (uploadError) throw uploadError;
        
        filePath = storagePath;
        fileName = selectedFile.name;
      }
      
      // Insert new option
      const { data, error } = await supabase
        .from('options')
        .insert([
          {
            title: newOptionTitle,
            description: newOptionDescription,
            agenda_id: agendaId,
            file_path: filePath,
            file_name: fileName
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Update options state
      setOptions([...options, ...(data || [])]);
      
      setIsAddOptionDialogOpen(false);
      toast.success("Option added successfully");
    } catch (error: any) {
      console.error("Error adding option:", error.message);
      toast.error("Failed to add option");
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      return dateString;
    }
  };

  // Set proper status badges based on agenda state
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <Badge variant="success" className="capitalize">Live</Badge>;
      case 'closed':
        return <Badge variant="default" className="capitalize">Closed</Badge>;
      default: // 'draft' or any other status
        return <Badge variant="outline" className="capitalize">Draft</Badge>;
    }
  };

  // Auto-close voting when end date is reached
  useEffect(() => {
    if (agenda?.status === 'live' && agenda?.end_date) {
      const endDate = new Date(agenda.end_date);
      const now = new Date();
      
      if (now > endDate) {
        handleCloseVoting();
      } else {
        // Set timeout to close voting automatically
        const timeUntilClose = endDate.getTime() - now.getTime();
        if (timeUntilClose < 2147483647) { // Max setTimeout value (~24.8 days)
          const timer = setTimeout(() => {
            handleCloseVoting();
          }, timeUntilClose);
          
          // Clean up timer
          return () => clearTimeout(timer);
        }
      }
    }
  }, [agenda]);

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
          <p className="mt-2">The agenda you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button className="mt-4" asChild>
            <Link to={`/projects/${projectId}`}>Back to Meeting</Link>
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
              <Link to="/">Home</Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link to="/projects">Projects</Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link to={`/projects/${projectId}`}>{project?.title}</Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{agenda?.title}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{agenda?.title}</h1>
              <p className="text-gray-600 mb-2">{agenda?.description}</p>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                {isAdmin && agenda.status === 'draft' && (
                  <Button 
                    onClick={handleStartVoting} 
                    className="bg-evoting-600 hover:bg-evoting-700 text-white"
                  >
                    <Vote className="mr-2 h-4 w-4" />
                    Start Voting
                  </Button>
                )}
                
                {isAdmin && agenda.status === 'live' && (
                  <>
                    <Button 
                      onClick={handleExtendEndDate}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Extend End Date
                    </Button>
                    
                    <Button 
                      onClick={handleCloseVoting}
                      variant="destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Close Meeting
                    </Button>
                  </>
                )}
                
                <Button 
                  asChild 
                  variant={agenda.status !== 'draft' ? "default" : "outline"}
                >
                  <Link to={`/projects/${projectId}/agenda/${agendaId}/results`}>
                    <ChartBar className="mr-2 h-4 w-4" />
                    View Results
                  </Link>
                </Button>
                
                {/* Status badge only shown in small detail, not above title */}
                <div className="hidden sm:flex items-center">
                  {getStatusBadge(agenda.status)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild>
                <Link to={`/projects/${projectId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Meeting
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="options">Voting Options</TabsTrigger>
            <TabsTrigger value="voters">Voting Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Agenda Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="mt-1">{getStatusBadge(agenda.status)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Voting Type</h3>
                    <p className="mt-1 capitalize">{agenda.voting_type || "Standard"}</p>
                  </div>
                  {agenda.status !== 'draft' && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                        <p className="mt-1">{formatDate(agenda.start_date)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                        <p className="mt-1">{formatDate(agenda.end_date)}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="options">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Voting Options</CardTitle>
                {isAdmin && agenda.status === 'draft' && (
                  <Button onClick={handleAddOption} className="bg-evoting-600 hover:bg-evoting-700 text-white">
                    <Upload className="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {options.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No voting options have been added yet.</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Option</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Document</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {options.map((option) => (
                          <TableRow key={option.id}>
                            <TableCell className="font-medium">{option.title}</TableCell>
                            <TableCell>{option.description || "-"}</TableCell>
                            <TableCell>
                              {option.file_path && option.file_name ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDownloadFile(option.file_path!, option.file_name!)}
                                  className="flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" />
                                  Download
                                </Button>
                              ) : (
                                <span className="text-gray-400 text-sm">No document</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="voters">
            <Card>
              <CardHeader>
                <CardTitle>Voting Status</CardTitle>
              </CardHeader>
              <CardContent>
                {voters.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No voters have been registered yet.</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead className="text-right">Weight (%)</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {voters.map((voter) => (
                          <TableRow key={voter.id}>
                            <TableCell className="font-medium">{voter.name}</TableCell>
                            <TableCell>{voter.email}</TableCell>
                            <TableCell>{voter.company_name || "-"}</TableCell>
                            <TableCell className="text-right">{voter.voting_weight}</TableCell>
                            <TableCell className="text-right capitalize">{voter.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Option Dialog */}
      <Dialog open={isAddOptionDialogOpen} onOpenChange={setIsAddOptionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Voting Option</DialogTitle>
            <DialogDescription>
              Create a new voting option with title, description and optional document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="Enter option title"
                value={newOptionTitle}
                onChange={(e) => setNewOptionTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Resolution</Label>
              <Textarea 
                id="description" 
                placeholder="Enter resolution text"
                value={newOptionDescription}
                onChange={(e) => setNewOptionDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Document (Optional - max 5MB)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="file" 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                />
              </div>
              <p className="text-xs text-gray-500">
                Accepted formats: PDF, Word, Excel, PowerPoint, ZIP (Max 5MB)
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              onClick={handleSubmitOption} 
              disabled={isUploading || !newOptionTitle}
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
            >
              {isUploading ? "Uploading..." : "Add Option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Start Voting Confirmation Dialog */}
      <Dialog open={isStartVotingDialogOpen} onOpenChange={setIsStartVotingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Voting</DialogTitle>
            <DialogDescription>
              Please select when voting should end. Voting will start immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`justify-start text-left font-normal ${!selectedEndDate ? "text-muted-foreground" : ""}`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedEndDate ? format(selectedEndDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedEndDate}
                    onSelect={setSelectedEndDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Once voting starts, you will not be able to add more options. Voting will automatically close on the selected end date.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={confirmStartVoting}
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
              disabled={!selectedEndDate}
            >
              Start Voting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Extend End Date Dialog */}
      <Dialog open={isExtendEndDateDialogOpen} onOpenChange={setIsExtendEndDateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend End Date</DialogTitle>
            <DialogDescription>
              Select a new end date for the voting period.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label>Current End Date</Label>
              <div className="text-sm">
                {agenda?.end_date ? format(new Date(agenda.end_date), "PPP p") : "Not set"}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="newEndDate">New End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`justify-start text-left font-normal ${!selectedEndDate ? "text-muted-foreground" : ""}`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedEndDate ? format(selectedEndDate, "PPP") : "Select new end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedEndDate}
                    onSelect={setSelectedEndDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={confirmExtendEndDate}
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
              disabled={!selectedEndDate}
            >
              Extend End Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendaDetail;
