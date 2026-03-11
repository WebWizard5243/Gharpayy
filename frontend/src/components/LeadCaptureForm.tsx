import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LEAD_SOURCES, LeadSource, Agent } from "@/lib/types";
import { addLead, getAgents } from "@/lib/store";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onLeadAdded: () => void;
}

export function LeadCaptureForm({ onLeadAdded }: Props) {
  const [open, setOpen]         = useState(false);
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [source, setSource]     = useState<LeadSource | "">("");
  const [location, setLocation] = useState("");
  const [agentId, setAgentId]   = useState<string>("");   // "" = let backend round-robin decide
  const [agents, setAgents]     = useState<Agent[]>([]);
  const [loading, setLoading]   = useState(false);

  // Fetch agents whenever dialog opens
  useEffect(() => {
    if (!open) return;
    getAgents()
      .then((data) => setAgents(data.filter((a) => a.active)))
      .catch(() => setAgents([]));
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !source) {
      toast.error("Please fill all required fields");
      return;
    }
    if (phone.trim().length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      await addLead({
        name:     name.trim(),
        phone:    phone.trim(),
        source:   source as LeadSource,
        location: location.trim(),
        // only pass agentId if manually selected
        ...(agentId ? { agentId: Number(agentId) } : {}),
      });
      toast.success("Lead created successfully");
      setName("");
      setPhone("");
      setSource("");
      setLocation("");
      setAgentId("");
      setOpen(false);
      onLeadAdded();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Capture New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              maxLength={100}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit number"
              maxLength={15}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Lead Source</Label>
            <Select
              value={source}
              onValueChange={(v) => setSource(v as LeadSource)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">
              Location <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Andheri, Mumbai"
              maxLength={150}
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Assign Agent <span className="text-muted-foreground text-xs">(optional — auto-assigned if blank)</span>
            </Label>
            <Select
              value={agentId}
              onValueChange={setAgentId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auto-assign via round robin" />
              </SelectTrigger>
              <SelectContent>
                {agents.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No agents available</div>
                ) : (
                  agents.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</>
            ) : (
              "Create Lead"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}