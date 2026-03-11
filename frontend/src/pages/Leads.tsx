import { useState, useCallback, useEffect } from "react";
import { getLeads } from "@/lib/store";
import { Lead, PIPELINE_STAGES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { LeadDetailPanel } from "@/components/LeadDetailPanel";

const Leads = () => {
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sorted = [...leads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleRowClick = (lead: Lead) => {
    const fresh = leads.find((l) => l.id === lead.id) || lead;
    setSelectedLead(fresh);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">All Leads</h2>
          <p className="text-sm text-muted-foreground">{leads.length} total leads</p>
        </div>
        <LeadCaptureForm onLeadAdded={refresh} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Agent</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Stage</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((lead) => {
                const stageInfo = PIPELINE_STAGES.find((s) => s.key === lead.stage);
                return (
                  <tr
                    key={lead.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(lead)}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">{lead.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{lead.phone}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className="text-xs">{lead.source}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{lead.assignedAgent}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${stageInfo?.color}`} />
                        <span className="text-xs">{stageInfo?.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDetailPanel
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={async () => {
          await refresh();
          if (selectedLead) {
            setSelectedLead((prev) =>
              leads.find((l) => l.id === prev?.id) ?? null
            );
          }
        }}
      />
    </div>
  );
};

export default Leads;