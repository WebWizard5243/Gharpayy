import { Lead, PIPELINE_STAGES } from "@/lib/types";
import { getDashboardInit } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

// ── Skeleton loader components ──────────────────────────────────────────────

const StatCardsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardContent className="pt-6 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-16" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const ChartsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {[...Array(2)].map((_, i) => (
      <Card key={i}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[280px]">
          <Skeleton className="h-full w-full rounded-md" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const TableSkeleton = () => (
  <Card>
    <CardHeader className="pb-0">
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="p-4 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// ────────────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["dashboard-init"],
    queryFn: getDashboardInit,
    refetchInterval: 30000,
  });

  const leads = data?.leads ?? [];
  const followUpLeads = data?.followUpLeads ?? [];
  const dashboardData: DashboardData = {
    leadsByStatus: data?.dashboard ?? [],
    visitsByOutcome: [
      {
        outcome: "Scheduled",
        count: leads.filter((l) => l.stage === "visit_scheduled").length,
      },
      {
        outcome: "Visited",
        count: leads.filter((l) => l.stage === "visit_completed").length,
      },
    ],
  };

  const recentLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  const totalLeads = dashboardData.leadsByStatus.reduce(
    (s, i) => s + i.count,
    0,
  );
  const visitsScheduled =
    dashboardData.visitsByOutcome.find((v) => v.outcome === "Scheduled")
      ?.count ?? 0;
  const bookings =
    dashboardData.leadsByStatus.find((s) => s.status === "Booked")?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Overview of your lead pipeline
        </p>
      </div>

      {loading ? (
        <>
          <StatCardsSkeleton />
          <ChartsSkeleton />
          <TableSkeleton />
        </>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Leads", value: totalLeads },
              { label: "Visits Scheduled", value: visitsScheduled },
              { label: "Bookings Confirmed", value: bookings },
              {
                label: "Follow-ups Due",
                value: followUpLeads.length,
                alert: followUpLeads.length > 0,
              },
            ].map((s) => (
              <Card
                key={s.label}
                className={s.alert ? "border-orange-400" : ""}
              >
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p
                    className={`text-3xl font-bold mt-1 ${s.alert ? "text-orange-500" : "text-foreground"}`}
                  >
                    {s.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Leads by Pipeline Stage
                </CardTitle>
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
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
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
                <CardTitle className="text-sm font-semibold">
                  Visits by Outcome
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dashboardData.visitsByOutcome} barSize={48}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="outcome"
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 12,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(217, 91%, 50%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Follow-up section */}
          {followUpLeads.length > 0 && (
            <Card className="border-orange-300">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-semibold text-orange-500">
                  ⚠ Follow-ups Due ({followUpLeads.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">
                          Phone
                        </th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">
                          Stage
                        </th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {followUpLeads.map((lead) => {
                        const stageInfo = PIPELINE_STAGES.find(
                          (s) => s.key === lead.stage,
                        );
                        return (
                          <tr
                            key={lead.id}
                            className="border-b border-border last:border-0 hover:bg-orange-50/10 cursor-pointer transition-colors"
                            onClick={() => navigate(`/leads?lead=${lead.id}`)}
                          >
                            <td className="px-4 py-2.5 font-medium text-foreground">
                              {lead.name}
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground">
                              {lead.phone}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`h-2 w-2 rounded-full ${stageInfo?.color}`}
                                />
                                <span className="text-xs">
                                  {stageInfo?.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground text-xs">
                              {formatDistanceToNow(new Date(lead.updatedAt), {
                                addSuffix: true,
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent leads table */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-semibold">
                Recent Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-2.5 font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground">
                        Phone
                      </th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground">
                        Source
                      </th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground">
                        Agent
                      </th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground">
                        Stage
                      </th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead) => {
                      const stageInfo = PIPELINE_STAGES.find(
                        (s) => s.key === lead.stage,
                      );
                      return (
                        <tr
                          key={lead.id}
                          className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => navigate(`/pipeline?lead=${lead.id}`)}
                        >
                          <td className="px-4 py-2.5 font-medium text-foreground">
                            {lead.name}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {lead.phone}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="secondary" className="text-xs">
                              {lead.source}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {lead.assignedAgent}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`h-2 w-2 rounded-full ${stageInfo?.color}`}
                              />
                              <span className="text-xs">
                                {stageInfo?.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(lead.createdAt), {
                              addSuffix: true,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
