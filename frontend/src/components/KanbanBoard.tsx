import { Lead, PIPELINE_STAGES, PipelineStage } from "@/lib/types";
import { LeadCard } from "./LeadCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onMoveStage: (leadId: number, stage: PipelineStage) => void; // id is number
}

export function KanbanBoard({ leads, onLeadClick, onMoveStage }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.stage === stage.key);
        return (
          <div key={stage.key} className="flex min-w-[240px] max-w-[280px] flex-1 flex-col rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
              <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
              <span className="text-xs font-semibold text-foreground">{stage.label}</span>
              <span className="ml-auto text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                {stageLeads.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-320px)]">
              {stageLeads.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">No leads</p>
              )}
              {stageLeads.map((lead) => (
                <div key={lead.id}>
                  <LeadCard lead={lead} onClick={() => onLeadClick(lead)} />
                  <Select
                    value={lead.stage}
                    onValueChange={(val) => onMoveStage(lead.id, val as PipelineStage)}
                  >
                    <SelectTrigger className="mt-1 h-7 text-[10px] bg-card">
                      <SelectValue placeholder="Move to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map((s) => (
                        <SelectItem key={s.key} value={s.key} className="text-xs">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}