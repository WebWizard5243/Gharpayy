import { useState, useEffect } from "react";
import { Lead, PIPELINE_STAGES } from "@/lib/types";
import { needsFollowUp, addVisitToLead, getVisits } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Phone, User, CalendarPlus, MapPin, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Visit {
  id: number;
  lead_id: number;
  property_name: string;
  visit_time: string;
  outcome: string;
  agent_id: number;
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadDetailPanel({ lead, open, onClose, onUpdate }: Props) {
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [property, setProperty]   = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [outcome, setOutcome]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Visits fetched from backend for this lead
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // Fetch visits whenever the panel opens for a lead
  useEffect(() => {
    if (!lead || !open) return;
    setLoadingVisits(true);
    getVisits()
      .then((all) => {
        // Filter to only this lead's visits
        const mine = (all as Visit[]).filter((v) => v.lead_id === lead.id);
        // Sort newest first
        mine.sort((a, b) => new Date(b.visit_time).getTime() - new Date(a.visit_time).getTime());
        setVisits(mine);
      })
      .catch((err) => {
        console.error("Failed to load visits:", err);
        setVisits([]);
      })
      .finally(() => setLoadingVisits(false));
  }, [lead, open]);

  if (!lead) return null;

  const stageInfo = PIPELINE_STAGES.find((s) => s.key === lead.stage);
  const followUp  = needsFollowUp(lead);

  const handleScheduleVisit = async () => {
    if (!property.trim() || !visitDate || !visitTime) {
      toast.error("Fill property, date and time");
      return;
    }

    setSubmitting(true);
    try {
      // agentId — use lead's assignedAgent id if it's a number, else 1 as fallback
      const agentId = Number(lead.assignedAgent) || 1;

      await addVisitToLead(lead.id, agentId, {
        propertyName: property.trim(),
        date:         visitDate,
        time:         visitTime,
        outcome:      outcome.trim(),
      });

      toast.success("Visit scheduled");

      // Refresh visits list
      const all = await getVisits();
      const mine = (all as Visit[]).filter((v) => v.lead_id === lead.id);
      mine.sort((a, b) => new Date(b.visit_time).getTime() - new Date(a.visit_time).getTime());
      setVisits(mine);

      setProperty("");
      setVisitDate("");
      setVisitTime("");
      setOutcome("");
      setShowVisitForm(false);
      onUpdate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule visit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {lead.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {followUp && (
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" />
              Follow Up Required — not updated in 24h+
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                <Phone className="h-3.5 w-3.5" />{lead.phone}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Source</p>
              <Badge variant="secondary" className="text-xs">{lead.source}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Agent</p>
              <p className="text-sm font-medium text-foreground">{lead.assignedAgent}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Stage</p>
              <div className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${stageInfo?.color}`} />
                <span className="text-sm font-medium text-foreground">{stageInfo?.label}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm text-foreground">
                {format(new Date(lead.createdAt), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm text-foreground">
                {format(new Date(lead.updatedAt), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Visit History</h3>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs"
                onClick={() => setShowVisitForm(!showVisitForm)}
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Schedule Visit
              </Button>
            </div>

            {showVisitForm && (
              <div className="mt-3 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Property Name</Label>
                  <Input
                    value={property}
                    onChange={(e) => setProperty(e.target.value)}
                    placeholder="e.g. Sunshine PG"
                    className="h-8 text-sm"
                    maxLength={100}
                    disabled={submitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="h-8 text-sm"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Time</Label>
                    <Input
                      type="time"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className="h-8 text-sm"
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Outcome (optional)</Label>
                  <Input
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="Visit feedback"
                    className="h-8 text-sm"
                    maxLength={200}
                    disabled={submitting}
                  />
                </div>
                <Button size="sm" onClick={handleScheduleVisit} className="w-full" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Scheduling...</>
                  ) : (
                    "Confirm Visit"
                  )}
                </Button>
              </div>
            )}

            {loadingVisits ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading visits...
              </div>
            ) : visits.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">No visits yet</p>
            ) : (
              <div className="mt-3 space-y-2">
                {visits.map((v) => {
                  const visitDt = new Date(v.visit_time);
                  return (
                    <div key={v.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {v.property_name}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(visitDt, "dd MMM yyyy")} at {format(visitDt, "HH:mm")}
                        </span>
                      </div>
                      {v.outcome && (
                        <p className="mt-1.5 text-xs text-muted-foreground italic">"{v.outcome}"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}