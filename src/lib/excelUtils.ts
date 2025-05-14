
import { utils, write } from "xlsx";

type VoteResultData = {
  option_title: string;
  approve: number;
  reject: number;
  abstain: number;
  total_weight: number;
  approve_percentage: number;
};

type VoterVoteData = {
  voter_name: string;
  voter_company?: string;
  voter_email: string;
  vote_value: string;
  voting_weight: number;
};

export interface ExcelExportData {
  projectName: string;
  meetingTitle: string;
  meetingDescription?: string;
  votingPeriod?: string;
  results: VoteResultData[];
  votesByOption: Record<string, VoterVoteData[]>;
}

export const exportToExcel = (data: ExcelExportData): void => {
  // Create a new workbook
  const workbook = utils.book_new();
  
  // Create summary sheet with results
  const summaryData = [
    ["Project", data.projectName],
    ["Meeting", data.meetingTitle],
    ["Description", data.meetingDescription || ""],
    ["Voting Period", data.votingPeriod || ""],
    [""],
    ["VOTING RESULTS SUMMARY"],
    ["Option", "Approval", "Approval %", "Rejection", "Rejection %", "Abstain", "Total Votes"]
  ];
  
  // Add result rows
  data.results.forEach(result => {
    const approvalPercent = result.approve_percentage;
    const rejectionPercent = 100 - approvalPercent;
    summaryData.push([
      result.option_title,
      String(result.approve),
      `${approvalPercent.toFixed(2)}%`,
      String(result.reject),
      `${rejectionPercent.toFixed(2)}%`,
      String(result.abstain),
      String(result.total_weight)
    ]);
  });

  // Create the summary worksheet
  const summaryWs = utils.aoa_to_sheet(summaryData);
  utils.book_append_sheet(workbook, summaryWs, "Summary");
  
  // Create a detailed sheet for each option
  data.results.forEach((result, index) => {
    const optionTitle = result.option_title;
    const voters = data.votesByOption[optionTitle] || [];
    
    const optionData = [
      [`Option: ${optionTitle}`],
      [""],
      ["Voter Name", "Company", "Email", "Vote", "Weight"]
    ];
    
    // Add voter rows
    if (voters.length > 0) {
      voters.forEach(voter => {
        optionData.push([
          voter.voter_name,
          voter.voter_company || "",
          voter.voter_email,
          voter.vote_value === "approve" 
            ? "Approve" 
            : voter.vote_value === "reject" 
              ? "Reject" 
              : "Abstain",
          String(voter.voting_weight)
        ]);
      });
    } else {
      optionData.push(["No votes recorded for this option"]);
    }
    
    // Create the option worksheet
    const optionWs = utils.aoa_to_sheet(optionData);
    utils.book_append_sheet(workbook, optionWs, `Option ${index + 1}`);
  });
  
  // Generate Excel file
  const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Create a Blob and download
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  const filename = `${data.projectName}_${data.meetingTitle}_Results.xlsx`
    .replace(/[^\w\s]/gi, '') // Remove special characters
    .replace(/\s+/g, '_');    // Replace spaces with underscores
    
  a.href = url;
  a.download = filename;
  a.click();
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
};
