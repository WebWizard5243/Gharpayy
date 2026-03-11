import { useState, useCallback, useEffect } from "react";
import { Lead, PipelineStage } from "@/lib/types";
import { getLeads, updateLeadStage } from "@/lib/store";
import { AnalyticsBar } from "@/components/AnalyticsBar";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";
import { Building2 } from "lucide-react";

const Index = () => {
  const [leads, setLeads] = useState<Lead[]>([]);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (err) {
      console.error("Failed to load leads:", err);
    }
  }, []);

  // Load leads on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleMoveStage = (leadId: number, stage: PipelineStage) => {
    updateLeadStage(leadId, stage)
      .then(() => refresh())
      .catch((err) => console.error("Failed to move stage:", err));
  };

  const handleLeadClick = (lead: Lead) => {
    // Re-read from current leads state to get latest data
    const fresh = leads.find((l) => l.id === lead.id) || lead;
    setSelectedLead(fresh);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">Gharpayy</h1>
              <p className="text-[10px] text-muted-foreground leading-none">PG Lead Management</p>
            </div>
          </div>
          <LeadCaptureForm onLeadAdded={refresh} />
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 md:px-6 space-y-4">
        <AnalyticsBar leads={leads} />
        <KanbanBoard leads={leads} onLeadClick={handleLeadClick} onMoveStage={handleMoveStage} />
      </main>

      {/* Detail Panel */}
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

export default Index;