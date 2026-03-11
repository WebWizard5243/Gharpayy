import { useState, useEffect } from "react";
import { getVisits, addVisitToLead, getLeads, getAgents } from "@/lib/store";
import { CalendarCheck, MapPin, Clock, CheckCircle2, Loader2, Plus, Pencil } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { Lead, Agent } from "@/lib/types";

const API_URL = "http://localhost:5001";

interface VisitRow {
  id: number;
  lead_id: number;
  property_name: string;
  visit_time: string;
  outcome: string;
  agent_id: number;
  lead_name?: string;
  lead_phone?: string;
}

const Visits = () => {
  const [visits, setVisits]   = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Dropdown data
  const [leads, setLeads]   = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Add visit form state
  const [open, setOpen]                 = useState(false);
  const [leadId, setLeadId]             = useState("");
  const [agentId, setAgentId]           = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [visitDate, setVisitDate]       = useState("");
  const [visitTime, setVisitTime]       = useState("");
  const [outcome, setOutcome]           = useState("");
  const [submitting, setSubmitting]     = useState(false);

  // Update outcome state
  const [updatingVisit, setUpdatingVisit]   = useState<VisitRow | null>(null);
  const [newOutcome, setNewOutcome]         = useState("");
  const [updatingOutcome, setUpdatingOutcome] = useState(false);

  const loadVisits = () => {
    setLoading(true);
    getVisits()
      .then((data) => setVisits(data as VisitRow[]))
      .catch((err) => console.error("Failed to load visits:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVisits();
  }, []);

  // Fetch leads & agents when add dialog opens
  useEffect(() => {
    if (!open) return;
    getLeads().then(setLeads).catch(() => setLeads([]));
    getAgents().then((data) => setAgents(data.filter((a) => a.active))).catch(() => setAgents([]));
  }, [open]);

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !agentId || !propertyName.trim() || !visitDate || !visitTime) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await addVisitToLead(Number(leadId), Number(agentId), {
        propertyName: propertyName.trim(),
        date: visitDate,
        time: visitTime,
        outcome: outcome.trim(),
      });
      toast.success("Visit scheduled successfully");
      setLeadId(""); setAgentId(""); setPropertyName("");
      setVisitDate(""); setVisitTime(""); setOutcome("");
      setOpen(false);
      loadVisits();
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule visit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutcome.trim() || !updatingVisit) {
      toast.error("Please enter an outcome");
      return;
    }
    setUpdatingOutcome(true);
    try {
      const res = await fetch(`${API_URL}/visits/${updatingVisit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: newOutcome.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update outcome");
      toast.success("Outcome updated — visit moved to Completed");
      setUpdatingVisit(null);
      setNewOutcome("");
      loadVisits();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update outcome. Please try again.");
    } finally {
      setUpdatingOutcome(false);
    }
  };

  const upcoming = visits
    .filter((v) => !v.outcome || v.outcome.toLowerCase() === "scheduled")
    .sort((a, b) => a.visit_time.localeCompare(b.visit_time));

  const completed = visits
    .filter((v) => !!v.outcome && v.outcome.toLowerCase() !== "scheduled")
    .sort((a, b) => b.visit_time.localeCompare(a.visit_time));

  const VisitTable = ({
    visits,
    emptyIcon,
    emptyText,
    showUpdateOutcome = false,
  }: {
    visits: VisitRow[];
    emptyIcon: React.ReactNode;
    emptyText: string;
    showUpdateOutcome?: boolean;
  }) =>
    visits.length === 0 ? (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        {emptyIcon}
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    ) : (
      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Lead</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Property</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Time</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Outcome</th>
                {showUpdateOutcome && (
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => {
                const dt = new Date(visit.visit_time);
                return (
                  <tr key={visit.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-foreground">
                        {visit.lead_name ?? `Lead #${visit.lead_id}`}
                      </p>
                      {visit.lead_phone && (
                        <p className="text-xs text-muted-foreground">{visit.lead_phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {visit.property_name}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {format(dt, "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(dt, "HH:mm")}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs italic">
                      {visit.outcome || "—"}
                    </td>
                    {showUpdateOutcome && (
                      <td className="px-4 py-2.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                          onClick={() => {
                            setUpdatingVisit(visit);
                            setNewOutcome("");
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                          Update Outcome
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Visits</h2>
          <p className="text-sm text-muted-foreground">Track upcoming and completed property visits</p>
        </div>

        {/* Add Visit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Visit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule a Visit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddVisit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Lead</Label>
                <Select value={leadId} onValueChange={setLeadId} disabled={submitting}>
                  <SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger>
                  <SelectContent>
                    {leads.length === 0
                      ? <div className="px-3 py-2 text-xs text-muted-foreground">No leads found</div>
                      : leads.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.name} <span className="ml-2 text-xs text-muted-foreground">{l.phone}</span>
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Agent</Label>
                <Select value={agentId} onValueChange={setAgentId} disabled={submitting}>
                  <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                  <SelectContent>
                    {agents.length === 0
                      ? <div className="px-3 py-2 text-xs text-muted-foreground">No active agents found</div>
                      : agents.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="propertyName">Property Name</Label>
                <Input id="propertyName" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="e.g. Sunshine PG" maxLength={100} disabled={submitting} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="visitDate">Date</Label>
                  <Input id="visitDate" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="visitTime">Time</Label>
                  <Input id="visitTime" type="time" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} disabled={submitting} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="outcome">Outcome <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Visit feedback" maxLength={200} disabled={submitting} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Scheduling...</> : "Schedule Visit"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Update Outcome Dialog */}
      <Dialog open={!!updatingVisit} onOpenChange={(o) => !o && setUpdatingVisit(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Visit Outcome</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateOutcome} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                Property: <span className="font-medium text-foreground">{updatingVisit?.property_name}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Lead: <span className="font-medium text-foreground">{updatingVisit?.lead_name ?? `Lead #${updatingVisit?.lead_id}`}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newOutcome">Outcome</Label>
              <Input
                id="newOutcome"
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder="e.g. Visited, No Show, Cancelled"
                maxLength={200}
                disabled={updatingOutcome}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Setting an outcome will move this visit to Completed.</p>
            </div>
            <Button type="submit" className="w-full" disabled={updatingOutcome || !newOutcome.trim()}>
              {updatingOutcome ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Outcome"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading visits...
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming" className="gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5" />
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <VisitTable
              visits={upcoming}
              emptyIcon={<CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />}
              emptyText="No upcoming visits scheduled"
              showUpdateOutcome={true}
            />
          </TabsContent>

          <TabsContent value="completed">
            <VisitTable
              visits={completed}
              emptyIcon={<CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />}
              emptyText="No completed visits yet"
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Visits;