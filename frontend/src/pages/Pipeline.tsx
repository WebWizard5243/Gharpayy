import { useState, useCallback, useEffect } from "react";
import { Lead, PipelineStage, PIPELINE_STAGES } from "@/lib/types";
import { getLeads, updateLeadStage, needsFollowUp } from "@/lib/store";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { Phone, Clock, AlertTriangle, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams } from "react-router-dom";

const Pipeline = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();

  const refresh = useCallback(async () => {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (err) {
      console.error("Failed to load leads:", err);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Open lead from query param once leads are loaded
  useEffect(() => {
    const leadIdFromUrl = searchParams.get("lead");
    if (leadIdFromUrl && leads.length > 0 && !selectedLead) {
      const found = leads.find((l) => l.id === Number(leadIdFromUrl));
      if (found) setSelectedLead(found);
    }
  }, [leads, searchParams, selectedLead]);

  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    if (draggedLeadId !== null) {
      try {
        await updateLeadStage(draggedLeadId, stage);
        await refresh();
      } catch (err) {
        console.error("Failed to update stage:", err);
      }
      setDraggedLeadId(null);
    }
  };

  const handleLeadClick = (lead: Lead) => {
    const fresh = leads.find((l) => l.id === lead.id) || lead;
    setSelectedLead(fresh);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Lead Pipeline</h2>
        <p className="text-sm text-muted-foreground">Drag leads between stages to update their status</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.key);
          return (
            <div
              key={stage.key}
              className="flex min-w-[250px] max-w-[280px] flex-1 flex-col rounded-lg bg-muted/50 border border-border"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                <span className="text-xs font-semibold text-foreground">{stage.label}</span>
                <span className="ml-auto text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                  {stageLeads.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                {stageLeads.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">No leads</p>
                )}
                {stageLeads.map((lead) => {
                  const followUp = needsFollowUp(lead);
                  return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => handleLeadClick(lead)}
                      className="w-full text-left rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30 cursor-grab active:cursor-grabbing"
                    >
                      {followUp && (
                        <div className="mb-2 flex items-center gap-1 rounded bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                          <AlertTriangle className="h-3 w-3" />
                          Follow Up
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-sm text-foreground truncate">{lead.name}</p>
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
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
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetailPanel
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={async () => {
          await refresh();
          if (selectedLead) {
            const fresh = leads.find((l) => l.id === selectedLead.id) || null;
            setSelectedLead(fresh);
          }
        }}
      />
    </div>
  );
};

export default Pipeline;