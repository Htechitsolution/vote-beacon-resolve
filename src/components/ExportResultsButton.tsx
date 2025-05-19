import React from 'react';
import { Button } from "@/components/ui/button";
import { CSVLink } from 'react-csv';
import { FileDown, FileTypeCsv } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ExportResultsButtonProps {
  agendaId: string;
  projectId: string;
  votersData: any[];
  agendaTitle: string;
}

const ExportResultsButton: React.FC<ExportResultsButtonProps> = ({ agendaId, projectId, votersData, agendaTitle }) => {
  const { toast } = useToast()

  // Prepare CSV data
  const csvData = React.useMemo(() => {
    const headers = [
      "Voter ID",
      "Name",
      "Email",
      "Company Name",
      "Voting Weight",
      "Vote",
      "Reason",
      "Timestamp"
    ];

    const data = votersData.map(voter => {
      const vote = voter.votes?.find(vote => vote.agenda_id === agendaId);
      return {
        "Voter ID": voter.id,
        "Name": voter.name,
        "Email": voter.email,
        "Company Name": voter.company_name,
        "Voting Weight": voter.voting_weight,
        "Vote": vote?.vote || 'N/A',
        "Reason": vote?.reason || 'N/A',
        "Timestamp": vote?.created_at || 'N/A'
      };
    });

    const csvHeaders = headers.map(header => ({ label: header, key: header.toLowerCase().replace(/ /g, '') }));
    const csvVotersData = data.map(item => {
      return {
        voterid: item["Voter ID"],
        name: item["Name"],
        email: item["Email"],
        companyname: item["Company Name"],
        votingweight: item["Voting Weight"]?.toString() || '0',
        vote: item["Vote"],
        reason: item["Reason"],
        timestamp: item["Timestamp"]
      };
    });

    return { headers: csvHeaders, data: csvVotersData };
  }, [votersData, agendaId]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileDown className="mr-2 h-4 w-4" />
          Export Results
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Export Confirmation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to export the voting results for {agendaTitle}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <CSVLink
            data={csvData.data}
            headers={csvData.headers}
            filename={`${agendaTitle.replace(/ /g, '_')}_results.csv`}
            onClick={() => toast({
              title: "Exporting Results",
              description: "The CSV file is being generated. Please wait...",
            })}
          >
            <AlertDialogAction>
              Export
            </AlertDialogAction>
          </CSVLink>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExportResultsButton;
