import { useState, useEffect, useCallback } from "react";
import { getAgents, addAgent, toggleAgentActive, deleteAgent, getProperties, addProperty, deleteProperty } from "@/lib/store";
import { Agent, Property } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Trash2, Building2, Plus, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const [agents, setAgents]               = useState<Agent[]>([]);
  const [properties, setProperties]       = useState<Property[]>([]);
  const [newAgentName, setNewAgentName]   = useState("");
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newPropertyName, setNewPropertyName] = useState("");
  const [loadingAgents, setLoadingAgents]     = useState(true);
  const [loadingProps, setLoadingProps]       = useState(true);
  const [savingAgent, setSavingAgent]         = useState(false);
  const [savingProp, setSavingProp]           = useState(false);

  const refreshAgents = useCallback(async () => {
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  }, []);

  const refreshProperties = useCallback(async () => {
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (err) {
      console.error("Failed to load properties:", err);
    }
  }, []);

  useEffect(() => {
    refreshAgents().finally(() => setLoadingAgents(false));
    refreshProperties().finally(() => setLoadingProps(false));
  }, [refreshAgents, refreshProperties]);

  // ── Agents ──────────────────────────────────────────

  const handleAddAgent = async () => {
    if (!newAgentName.trim()) return;
    setSavingAgent(true);
    try {
      await addAgent(newAgentName.trim(), newAgentEmail.trim());
      await refreshAgents();
      setNewAgentName("");
      setNewAgentEmail("");
      toast.success("Agent added");
    } catch {
      toast.error("Failed to add agent");
    } finally {
      setSavingAgent(false);
    }
  };

  const handleToggleAgent = async (id: number) => {
    try {
      await toggleAgentActive(id);
      await refreshAgents();
    } catch {
      toast.error("Failed to toggle agent");
    }
  };

  const handleDeleteAgent = async (id: number) => {
    try {
      await deleteAgent(id);
      await refreshAgents();
      toast.success("Agent deleted");
    } catch {
      toast.error("Failed to delete agent");
    }
  };

  // ── Properties ──────────────────────────────────────

  const handleAddProperty = async () => {
    if (!newPropertyName.trim()) return;
    setSavingProp(true);
    try {
      await addProperty(newPropertyName.trim());
      await refreshProperties();
      setNewPropertyName("");
      toast.success("Property added");
    } catch {
      toast.error("Failed to add property");
    } finally {
      setSavingProp(false);
    }
  };

  const handleDeleteProperty = async (id: number) => {
    try {
      await deleteProperty(id);
      await refreshProperties();
      toast.success("Property deleted");
    } catch {
      toast.error("Failed to delete property");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage agents and properties</p>
      </div>

      {/* Agents Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Agents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Agent name"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAgent()}
              className="max-w-xs"
              disabled={savingAgent}
            />
            <Input
              placeholder="Agent email"
              value={newAgentEmail}
              onChange={(e) => setNewAgentEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAgent()}
              className="max-w-xs"
              disabled={savingAgent}
            />
            <Button
              size="sm"
              onClick={handleAddAgent}
              disabled={!newAgentName.trim() || savingAgent}
            >
              {savingAgent
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <><Plus className="h-3.5 w-3.5 mr-1" />Add</>
              }
            </Button>
          </div>

          {loadingAgents ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading agents...
            </div>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{agent.name}</span>
                    <Badge variant={agent.active ? "default" : "secondary"} className="text-[10px]">
                      {agent.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleToggleAgent(agent.id)}
                      title={agent.active ? "Deactivate" : "Activate"}
                    >
                      {agent.active
                        ? <ToggleRight className="h-4 w-4 text-primary" />
                        : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAgent(agent.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No agents added yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Properties Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Property name"
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddProperty()}
              className="max-w-xs"
              disabled={savingProp}
            />
            <Button
              size="sm"
              onClick={handleAddProperty}
              disabled={!newPropertyName.trim() || savingProp}
            >
              {savingProp
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <><Plus className="h-3.5 w-3.5 mr-1" />Add</>
              }
            </Button>
          </div>

          {loadingProps ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading properties...
            </div>
          ) : (
            <div className="space-y-2">
              {properties.map((prop) => (
                <div
                  key={prop.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">{prop.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteProperty(prop.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {properties.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No properties added yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;