import { Lead, PIPELINE_STAGES } from "@/lib/types";
import { Users, Eye, CheckCircle, BarChart3 } from "lucide-react";

interface Props {
  leads: Lead[];
}

export function AnalyticsBar({ leads }: Props) {
  const totalLeads = leads.length;
  const visitsScheduled = leads.filter((l) => l.stage === "visit_scheduled").length;
  const bookings = leads.filter((l) => l.stage === "booked").length;
  const visitsCompleted = leads.filter((l) => l.stage === "visit_completed").length;

  const stats = [
    { label: "Total Leads", value: totalLeads, icon: Users },
    { label: "Visits Scheduled", value: visitsScheduled, icon: Eye },
    { label: "Visits Completed", value: visitsCompleted, icon: BarChart3 },
    { label: "Bookings", value: bookings, icon: CheckCircle },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3 rounded-lg bg-card p-4 shadow-sm border border-border">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
            <s.icon className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
