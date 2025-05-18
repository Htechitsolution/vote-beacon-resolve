
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel, VotingResult, AgendaResult } from "@/lib/excelExport";
import { toast } from "sonner";

interface ExportResultsButtonProps {
  projectId: string;
  className?: string;
}

const ExportResultsButton = ({ projectId, className }: ExportResultsButtonProps) => {
  const [isExporting, setIsExporting] = React.useState(false);
  
  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      if (error) throw error;
      return data;
    }
  });

  // Fetch all agendas for this project
  const { data: agendas } = useQuery({
    queryKey: ['agendas', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .eq('project_id', projectId);
        
      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      if (!project || !agendas || agendas.length === 0) {
        toast.error("No data available to export");
        return;
      }
      
      // Prepare result structure
      const votingResult: VotingResult = {
        projectName: project.title,
        meetingName: project.title, // Using project title as meeting name
        startDate: project.created_at,
        endDate: new Date().toISOString(),
        agendas: []
      };
      
      // Process each agenda
      for (const agenda of agendas) {
        // Fetch options for this agenda
        const { data: options } = await supabase
          .from('options')
          .select('*')
          .eq('agenda_id', agenda.id);
          
        // Fetch votes for this agenda
        const { data: votes } = await supabase
          .from('votes')
          .select('*, voter:voter_id(*)')
          .eq('agenda_id', agenda.id);
          
        if (!options || !votes) continue;
        
        // Calculate results
        const totalVotes = votes.length;
        let approvalCount = 0;
        
        // Process options
        const optionResults = options.map(option => {
          const optionVotes = votes.filter(v => v.option_id === option.id);
          const approveVotes = optionVotes.filter(v => v.value === 'approve');
          
          approvalCount += approveVotes.length;
          
          return {
            id: option.id,
            title: option.title,
            description: option.description || "",
            votes: optionVotes.length,
            percentage: totalVotes > 0 ? (optionVotes.length / totalVotes) * 100 : 0
          };
        });
        
        // Process voters
        const voterResults = votes.map(vote => ({
          id: vote.voter.id,
          name: vote.voter.name || "Anonymous",
          email: vote.voter.email,
          votingWeight: vote.voting_weight ? parseFloat(vote.voting_weight) : 1,
          vote: vote.value || "Unknown",
          votedAt: vote.created_at
        }));
        
        // Add agenda to results
        votingResult.agendas.push({
          id: agenda.id,
          title: agenda.title,
          description: agenda.description || "",
          votingType: agenda.voting_type,
          totalVotes,
          approvalPercentage: totalVotes > 0 ? (approvalCount / totalVotes) * 100 : 0,
          options: optionResults,
          voters: voterResults
        });
      }
      
      // Export to Excel
      exportToExcel(votingResult);
      toast.success("Voting results exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export results");
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Button 
      onClick={handleExport} 
      variant="outline"
      disabled={isExporting}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export Results"}
    </Button>
  );
};

export default ExportResultsButton;
