import {
  Lead,
  LeadSource,
  PipelineStage,
  Agent,
  Property,
  BACKEND_TO_STAGE,
  STAGE_TO_BACKEND,
} from "./types";

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5001"
    : "https://gharpayy-nine-beta.vercel.app";

function mapLead(row: any): Lead {
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone,
    source: row.source as LeadSource,
    stage: BACKEND_TO_STAGE[row.status] ?? "new_lead",
    assignedAgent: row.assigned_agent_id ? String(row.assigned_agent_id) : "—",
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.created_at ?? row.createdAt,
    visits: [],
    notes: row.notes ?? "",
    location: row.location ?? "",
  };
}

function mapAgent(row: any): Agent {
  return {
    id: Number(row.id),
    name: row.name,
    active: row.active ?? true,
    createdAt: row.created_at ?? row.createdAt ?? "",
  };
}

// GET /leads
export async function getLeads(): Promise<Lead[]> {
  const res = await fetch(`${API_URL}/leads`);
  if (!res.ok) throw new Error("Failed to fetch leads");
  const json = await res.json();
  const rows: any[] = Array.isArray(json.result) ? json.result : [];
  return rows.map(mapLead);
}

// POST /newLeads
export async function addLead(data: {
  name: string;
  phone: string;
  source: LeadSource;
  location?: string;
  agentId?: number;
}): Promise<Lead> {
  const res = await fetch(`${API_URL}/newLeads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      source: data.source,
      status: "New Lead",
      createdAt: new Date().toISOString(),
      location: data.location ?? "",
      // only send agentId if manually selected — otherwise backend round-robin handles it
      ...(data.agentId ? { agentId: data.agentId } : {}),
    }),
  });
  if (!res.ok) throw new Error("Failed to create lead");
  const json = await res.json();
  // backend returns { message, data: row }
  return mapLead(json.data);
}

// PATCH /leads/:id
export async function updateLeadStage(id: number, stage: PipelineStage) {
  const res = await fetch(`${API_URL}/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // backend expects the human-readable status string
      status: STAGE_TO_BACKEND[stage],
    }),
  });
  if (!res.ok) throw new Error("Failed to update lead stage");
}

// GET /leads/followup
export async function getFollowUpLeads(): Promise<Lead[]> {
  const res = await fetch(`${API_URL}/leads/followup`);
  if (res.status === 404) return []; // backend returns 404 when none found
  if (!res.ok) throw new Error("Failed to fetch follow-up leads");
  const json = await res.json();
  const rows: any[] = Array.isArray(json.result) ? json.result : [];
  return rows.map(mapLead);
}

// GET /api/init — combined call for dashboard
export async function getDashboardInit() {
  const res = await fetch(`${API_URL}/init`);
  if (!res.ok) throw new Error("Failed to fetch init data");
  const json = await res.json();
  const data = json.result;
  return {
    leads: (data.leads ?? []).map(mapLead),
    followUpLeads: (data.followUpLeads ?? []).map(mapLead),
    dashboard: data.dashboard ?? [],
    agents: data.agents ?? [],
  };
}

// POST /visits
export async function addVisitToLead(
  leadId: number,
  agentId: number,
  visit: {
    propertyName: string;
    date: string;
    time: string;
    outcome: string;
  },
) {
  const res = await fetch(`${API_URL}/visits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leadId: leadId,
      agentId: agentId,
      propertyName: visit.propertyName,
      visitTime: `${visit.date}T${visit.time}`,
      outcome: visit.outcome,
    }),
  });
  if (!res.ok) throw new Error("Failed to add visit");
  const json = await res.json();
  return json.result?.[0] ?? null;
}

// GET /visits
export async function getVisits() {
  const res = await fetch(`${API_URL}/visits`);
  if (!res.ok) throw new Error("Failed to fetch visits");
  const json = await res.json();
  return Array.isArray(json.result) ? json.result : [];
}

export function needsFollowUp(lead: Lead): boolean {
  const lastUpdate = new Date(lead.updatedAt).getTime();
  const now = Date.now();
  return (
    now - lastUpdate > 24 * 60 * 60 * 1000 &&
    lead.stage !== "booked" &&
    lead.stage !== "lost"
  );
}

//PATCH /visits

export async function updateVisits(id: number, outcome: string) {
  const res = await fetch(`${API_URL}/visits/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outcome }),
  });
  if (!res.ok) {
    throw new Error("Failed to update visit outcome");
  }
  const json = await res.json();
  return json.data;
}

// GET /agents
export async function getAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_URL}/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  const json = await res.json();
  // handle both { result: [...] } and plain array
  const rows: any[] = Array.isArray(json)
    ? json
    : Array.isArray(json.result)
      ? json.result
      : [];
  return rows.map(mapAgent);
}

// POST /agents
export async function addAgent(
  name: string,
  email: string = "",
): Promise<Agent> {
  const res = await fetch(`${API_URL}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) throw new Error("Failed to add agent");
  const json = await res.json();
  const row = Array.isArray(json.result) ? json.result[0] : json;
  return mapAgent(row);
}

// PATCH /agents/:id/toggle
export async function toggleAgentActive(id: number) {
  const res = await fetch(`${API_URL}/agents/${id}/toggle`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to toggle agent");
  const json = await res.json();
  return mapAgent(json.data);
}

// DELETE /agents/:id
export async function deleteAgent(id: number) {
  const res = await fetch(`${API_URL}/agents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete agent");
}

// ===========================
// PROPERTIES
// ===========================

// NOTE: /properties endpoints are not in your backend yet.
// These are stubbed so the frontend doesn't crash.

export async function getProperties(): Promise<Property[]> {
  try {
    const res = await fetch(`${API_URL}/properties`);
    if (!res.ok) return [];
    const json = await res.json();
    const rows: any[] = Array.isArray(json)
      ? json
      : Array.isArray(json.result)
        ? json.result
        : [];
    return rows.map((r: any) => ({
      id: Number(r.id),
      name: r.name,
      createdAt: r.created_at ?? "",
    }));
  } catch {
    return [];
  }
}

export async function addProperty(name: string): Promise<Property> {
  const res = await fetch(`${API_URL}/properties`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to add property");
  const json = await res.json();
  const r = json.result?.[0] ?? json;
  return { id: Number(r.id), name: r.name, createdAt: r.created_at ?? "" };
}

export async function deleteProperty(id: number) {
  await fetch(`${API_URL}/properties/${id}`, { method: "DELETE" });
}
