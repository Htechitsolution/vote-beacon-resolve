
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("bg-primary font-medium text-primary-foreground", className)}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// New component to display the voting results visually
const TableVotingStatus = React.forwardRef<
  HTMLDivElement, 
  React.HTMLAttributes<HTMLDivElement> & { 
    approved?: number; 
    disapproved?: number; 
    abstained?: number;
    requiredApproval?: number;
  }
>(({ className, approved = 0, disapproved = 0, abstained = 0, requiredApproval = 50, ...props }, ref) => {
  const total = approved + disapproved + abstained;
  const approvedPercent = total > 0 ? (approved / total * 100) : 0;
  const disapprovedPercent = total > 0 ? (disapproved / total * 100) : 0;
  const abstainedPercent = total > 0 ? (abstained / total * 100) : 0;
  
  const isPassing = approvedPercent >= requiredApproval;

  return (
    <div 
      ref={ref} 
      className={cn("flex flex-col space-y-1", className)} 
      {...props}
    >
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
        {approved > 0 && (
          <div 
            className="h-full bg-green-500" 
            style={{ width: `${approvedPercent}%` }}
          />
        )}
        {disapproved > 0 && (
          <div 
            className="h-full bg-red-500" 
            style={{ width: `${disapprovedPercent}%` }}
          />
        )}
        {abstained > 0 && (
          <div 
            className="h-full bg-gray-400" 
            style={{ width: `${abstainedPercent}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className={`font-medium ${isPassing ? "text-green-600" : "text-gray-600"}`}>
            {approvedPercent.toFixed(0)}% Approved
          </span>
          {requiredApproval > 0 && (
            <span className="text-gray-400">
              (min {requiredApproval}%)
            </span>
          )}
        </div>
        <div className="flex gap-3 text-xs">
          {disapproved > 0 && (
            <span className="text-red-600">
              {disapprovedPercent.toFixed(0)}% Against
            </span>
          )}
          {abstained > 0 && (
            <span className="text-gray-500">
              {abstainedPercent.toFixed(0)}% Abstained
            </span>
          )}
        </div>
      </div>
    </div>
  );
})
TableVotingStatus.displayName = "TableVotingStatus"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableVotingStatus
}
