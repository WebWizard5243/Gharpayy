import { useEffect, useState } from "react";
import { Lead, PIPELINE_STAGES, BACKEND_TO_STAGE } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BASE_URL = "https://gharpayy-upsa.onrender.com";

const CHART_COLORS = [
  "hsl(217, 91%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(38, 92%, 50%)",
  "hsl(20, 90%, 48%)",
  "hsl(168, 60%, 38%)",
  "hsl(142, 71%, 45%)",
  "hsl(168, 80%, 30%)",
  "hsl(0, 72%, 51%)",
];

interface DashboardData {
  leadsByStatus: { status: string; count: number }[];
  visitsByOutcome: { outcome: string; count: number }[];
}

// Build dashboard data from leads array fetched from backend
function buildDashboardFromLeads(leads: Lead[]): DashboardData {
  const leadsByStatus = PIPELINE_STAGES.map((s) => ({
    status: s.label,
    count: leads.filter((l) => l.stage === s.key).length,
  })).filter((s) => s.count > 0);

  const visitsByOutcome = [
    { outcome: "Scheduled", count: leads.filter((l) => l.stage === "visit_scheduled").length },
    { outcome: "Visited",   count: leads.filter((l) => l.stage === "visit_completed").length },
  ];

  return { leadsByStatus, visitsByOutcome };
}

// Map a raw DB row → Lead shape the UI expects
function mapLead(row: any): Lead {
  return {
    id:            Number(row.id),
    name:          row.name,
    phone:         row.phone,
    source:        row.source,
    stage:         BACKEND_TO_STAGE[row.status] ?? "new_lead",
    assignedAgent: row.assigned_agent_id ? String(row.assigned_agent_id) : "—",
    createdAt:     row.created_at,
    updatedAt:     row.updated_at ?? row.created_at,
    visits:        [],
    notes:         row.notes ?? "",
  };
}

async function fetchAllLeads(): Promise<Lead[]> {
  const res = await fetch(`${BASE_URL}/leads`);
  if (!res.ok) throw new Error("Failed to fetch leads");
  const json = await res.json();
  // backend returns { result: [...] }
  const rows: any[] = Array.isArray(json.result) ? json.result : [];
  return rows.map(mapLead);
}

async function fetchDashboardData(): Promise<DashboardData> {
  // Try the /dashboard endpoint first (returns status counts)
  try {
    const res = await fetch(`${BASE_URL}/dashboard`);
    if (res.ok) {
      const json = await res.json();
      // backend returns { result: [{ status, count }, ...] }
      const rows: { status: string; count: string }[] = Array.isArray(json.result) ? json.result : [];

      const leadsByStatus = rows
        .map((r) => ({ status: r.status, count: Number(r.count) }))
        .filter((r) => r.count > 0);

      // /dashboard doesn't have visit breakdown — fetch leads for that
      const leads = await fetchAllLeads();
      const visitsByOutcome = [
        { outcome: "Scheduled", count: leads.filter((l) => l.stage === "visit_scheduled").length },
        { outcome: "Visited",   count: leads.filter((l) => l.stage === "visit_completed").length },
      ];

      return { leadsByStatus, visitsByOutcome };
    }
  } catch {
    // fall through to full-leads fallback
  }

  // Fallback: build everything from /leads
  const leads = await fetchAllLeads();
  return buildDashboardFromLeads(leads);
}

const Dashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllLeads()
      .then(setLeads)
      .catch((err) => console.error("Failed to load leads:", err));
  }, []);

  const { data } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
  });

  // While query is loading, build from already-fetched leads
  const dashboardData = data ?? buildDashboardFromLeads(leads);

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const totalLeads       = dashboardData.leadsByStatus.reduce((s, i) => s + i.count, 0);
  const visitsScheduled  = dashboardData.visitsByOutcome.find((v) => v.outcome === "Scheduled")?.count ?? 0;
  const bookings         = dashboardData.leadsByStatus.find((s) => s.status === "Booked")?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview of your lead pipeline</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Leads",         value: totalLeads },
          { label: "Visits Scheduled",    value: visitsScheduled },
          { label: "Bookings Confirmed",  value: bookings },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Leads by Pipeline Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dashboardData.leadsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {dashboardData.leadsByStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Visits by Outcome</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboardData.visitsByOutcome} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="outcome" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent leads table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-semibold">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                {recentLeads.map((lead) => {
                  const stageInfo = PIPELINE_STAGES.find((s) => s.key === lead.stage);
                  return (
                    <tr
                      key={lead.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/pipeline?lead=${lead.id}`)}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;