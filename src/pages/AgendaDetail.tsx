import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/layout/Navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Import our new AgendaOptionForm component
import AgendaOptionForm from "@/components/AgendaOptionForm";

interface Project {
  id: string;
  created_at: string;
  title: string;
  description: string;
}

interface Agenda {
  id: string;
  created_at: string;
  title: string;
  description: string;
  project_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  voting_type: string;
}

const AgendaDetail = () => {
  const { projectId, agendaId } = useParams<{ projectId: string; agendaId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [votingType, setVotingType] = useState("single_choice");
  const [isSaving, setIsSaving] = useState(false);
  
  const [options, setOptions] = useState<any[]>([]);
  
  const initializeDefaultOptions = () => {
    return [
      { id: `temp-${Date.now()}-1`, title: "Agree (Approve the agenda)", description: "" },
      { id: `temp-${Date.now()}-2`, title: "Disagree (You Do not agree)", description: "" },
      { id: `temp-${Date.now()}-3`, title: "Abstain (No Say)", description: "" }
    ];
  };

  useEffect(() => {
    if (agendaId) {
      fetchAgenda();
      fetchOptions();
    } else {
      setOptions(initializeDefaultOptions());
    }
  }, [agendaId]);

  const fetchAgenda = async () => {
    try {
      const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .eq('id', agendaId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setAgenda(data);
        setTitle(data.title);
        setDescription(data.description);
        setStatus(data.status);
        setStartDate(data.start_date ? new Date(data.start_date) : undefined);
        setEndDate(data.end_date ? new Date(data.end_date) : undefined);
        setVotingType(data.voting_type);
      }
    } catch (error: any) {
      console.error("Error fetching agenda:", error.message);
      toast.error("Failed to load agenda");
    }
  };

  const fetchOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('options')
        .select('*')
        .eq('agenda_id', agendaId);

      if (error) throw error;

      if (data && data.length > 0) {
        setOptions(data);
      } else {
        // If no options exist for this agenda, initialize with defaults
        setOptions(initializeDefaultOptions());
      }
    } catch (error: any) {
      console.error("Error fetching options:", error.message);
      toast.error("Failed to load voting options");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Validate the input - character limits
      if (title.length > 100) {
        toast.error("Meeting title is limited to 100 characters");
        setIsSaving(false);
        return;
      }
      
      if (description && description.length > 100) {
        toast.error("Meeting description is limited to 100 characters");
        setIsSaving(false);
        return;
      }
      
      // Validate options
      if (options.length === 0) {
        toast.error("At least one voting option is required");
        setIsSaving(false);
        return;
      }
      
      for (const option of options) {
        if (!option.title.trim()) {
          toast.error("All option titles must be filled");
          setIsSaving(false);
          return;
        }
        
        if (option.description && option.description.length > 1000) {
          toast.error("Resolution text is limited to 1000 characters");
          setIsSaving(false);
          return;
        }
      }
      
      // Create or update agenda
      let agendaResult;
      
      if (agendaId) {
        // Update existing agenda
        const { data, error } = await supabase
          .from('agendas')
          .update({
            title,
            description,
            status,
            start_date: startDate?.toISOString() || null,
            end_date: endDate?.toISOString() || null,
            voting_type
          })
          .eq('id', agendaId)
          .select();

        if (error) throw error;
        agendaResult = data?.[0];
      } else {
        // Create new agenda
        const { data, error } = await supabase
          .from('agendas')
          .insert([
            {
              title,
              description,
              project_id: projectId,
              status: 'draft',
              start_date: startDate?.toISOString() || null,
              end_date: endDate?.toISOString() || null,
              voting_type
            }
          ])
          .select();

        if (error) throw error;
        agendaResult = data?.[0];
      }

      // Handle options - create/update/delete
      if (agendaResult) {
        const currentAgendaId = agendaResult.id;
        
        // Get existing options to compare for deletion
        const { data: existingOptions, error: fetchError } = await supabase
          .from('options')
          .select('id')
          .eq('agenda_id', currentAgendaId);

        if (fetchError) throw fetchError;

        const existingOptionIds = (existingOptions || []).map(o => o.id);
        const updatedOptionIds = options.filter(o => !o.id.toString().includes('temp-')).map(o => o.id);
        
        // Delete options that are no longer in the form
        const optionsToDelete = existingOptionIds.filter(id => !updatedOptionIds.includes(id));
        if (optionsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('options')
            .delete()
            .in('id', optionsToDelete);
            
          if (deleteError) throw deleteError;
        }
        
        // Upsert options
        const optionsToUpsert = options.map(option => ({
          id: option.id.toString().includes('temp-') ? undefined : option.id,
          title: option.title,
          description: option.description || null,
          agenda_id: currentAgendaId
        }));
        
        const { error: upsertError } = await supabase
          .from('options')
          .upsert(optionsToUpsert, { onConflict: 'id' })
          .select();
          
        if (upsertError) throw upsertError;
      }

      toast.success("Meeting saved successfully");
      // Navigate to the project details page
      navigate(`/projects/${projectId}`);
    } catch (error: any) {
      console.error("Error saving agenda:", error.message);
      toast.error(`Failed to save meeting: ${error.message}`);
    } finally {
      setIsSaving(false);
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
              <BreadcrumbLink>
                <Link to={`/projects/${projectId}`}>
                  {projectId ? 'Back to Project' : 'Select Project'}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{agendaId ? 'Edit Meeting' : 'Create Meeting'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <h1 className="text-3xl font-bold mb-4">{agendaId ? 'Edit Meeting' : 'Create Meeting'}</h1>
        
        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="flex justify-between">
                <Label htmlFor="title">Meeting Title</Label>
                <span className="text-xs text-gray-500">
                  {100 - title.length} characters remaining
                </span>
              </div>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="Enter meeting title"
                maxLength={100}
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <div className="flex justify-between">
                <Label htmlFor="description">Meeting Description</Label>
                <span className="text-xs text-gray-500">
                  {100 - (description?.length || 0)} characters remaining
                </span>
              </div>
              <Textarea
                id="description"
                value={description || ''}
                onChange={(e) => setDescription(e.target.value.slice(0, 100))}
                placeholder="Enter meeting description"
                maxLength={100}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <DatePicker
                  selected={startDate}
                  onSelect={setStartDate}
                  placeholderText="Select start date"
                />
              </div>
              
              <div>
                <Label>End Date</Label>
                <DatePicker
                  selected={endDate}
                  onSelect={setEndDate}
                  placeholderText="Select end date"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="votingType">Voting Type</Label>
              <Select
                value={votingType}
                onValueChange={setVotingType}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select voting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_choice">Single Choice (One option per voter)</SelectItem>
                  <SelectItem value="approval">Approval Voting (Vote on multiple options)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Replace the options section with our new component */}
            <div className="pt-4">
              <AgendaOptionForm 
                options={options}
                onOptionsChange={setOptions}
                isLoading={isSaving}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/projects/${projectId}`)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-evoting-600 hover:bg-evoting-700 text-white"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-b-2 rounded-full border-white"></span>
                  Saving...
                </>
              ) : (
                "Save Meeting"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgendaDetail;
