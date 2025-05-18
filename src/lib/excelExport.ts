
import * as XLSX from "xlsx";

export interface VotingResult {
  projectName: string;
  meetingName: string;
  startDate: Date | string;
  endDate: Date | string;
  agendas: AgendaResult[];
}

export interface AgendaResult {
  id: string;
  title: string;
  description: string;
  votingType: string;
  totalVotes: number;
  approvalPercentage: number;
  options: OptionResult[];
  voters: VoterResult[];
}

export interface OptionResult {
  id: string;
  title: string;
  description: string;
  votes: number;
  percentage: number;
}

export interface VoterResult {
  id: string;
  name: string;
  email: string;
  votingWeight: number;
  vote: string;
  votedAt: Date | string;
}

export const exportToExcel = (result: VotingResult) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Add summary sheet
  const summaryData = [
    ["Voting Results Summary"],
    [],
    ["Project Name", result.projectName],
    ["Meeting Name", result.meetingName],
    ["Start Date", formatDate(result.startDate)],
    ["End Date", formatDate(result.endDate)],
    [],
    ["Agendas", "Total Votes", "Approval %"],
    ...result.agendas.map(agenda => [
      agenda.title, 
      agenda.totalVotes, 
      `${agenda.approvalPercentage.toFixed(2)}%`
    ])
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  
  // Add sheet for each agenda
  result.agendas.forEach((agenda, index) => {
    // Sheet for agenda details and options
    const agendaData = [
      [`Agenda: ${agenda.title}`],
      [`Description: ${agenda.description || "N/A"}`],
      [],
      ["Voting Type", agenda.votingType],
      ["Total Votes", agenda.totalVotes.toString()],
      ["Approval Percentage", `${agenda.approvalPercentage.toFixed(2)}%`],
      [],
      ["Options", "Votes", "Percentage"],
      ...agenda.options.map(option => [
        option.title,
        option.votes,
        `${option.percentage.toFixed(2)}%`
      ]),
      [],
      ["Voters Detail"],
      ["Name", "Email", "Voting Weight", "Vote", "Voted At"],
      ...agenda.voters.map(voter => [
        voter.name || "Anonymous",
        voter.email,
        voter.votingWeight,
        voter.vote,
        formatDate(voter.votedAt)
      ])
    ];
    
    const agendaSheet = XLSX.utils.aoa_to_sheet(agendaData);
    
    // Set column widths
    const cols = [
      { wch: 30 }, // A - Names/titles
      { wch: 30 }, // B - Emails/values
      { wch: 15 }, // C - Weights/percentages
      { wch: 15 }, // D - Votes
      { wch: 20 }, // E - Dates
    ];
    agendaSheet["!cols"] = cols;
    
    XLSX.utils.book_append_sheet(wb, agendaSheet, `Agenda ${index + 1}`);
  });
  
  // Generate the Excel file
  XLSX.writeFile(wb, `${result.projectName} - Voting Results.xlsx`);
};

// Helper to format dates
const formatDate = (date: Date | string): string => {
  if (!date) return "N/A";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return "Invalid Date";
  }
  
  return d.toLocaleString();
};
