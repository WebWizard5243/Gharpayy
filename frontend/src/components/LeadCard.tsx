import { Lead } from "@/lib/types";
import { needsFollowUp } from "@/lib/store";
import { Phone, Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: Props) {
  const followUp = needsFollowUp(lead);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {followUp && (
        <div className="mb-2 flex items-center gap-1 rounded bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
          <AlertTriangle className="h-3 w-3" />
          Follow Up Required
        </div>
      )}
      <p className="font-semibold text-sm text-foreground truncate">{lead.name}</p>
      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Phone className="h-3 w-3" />
        {lead.phone}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="rounded bg-secondary px-1.5 py-0.5">{lead.source}</span>
        <span className="truncate max-w-[80px]">{lead.assignedAgent.split(" ")[0]}</span>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="h-2.5 w-2.5" />
        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
      </div>
    </button>
  );
}
