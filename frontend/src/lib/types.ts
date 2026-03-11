export type PipelineStage =
  | "new_lead"
  | "contacted"
  | "requirement_collected"
  | "property_suggested"
  | "visit_scheduled"
  | "visit_completed"
  | "booked"
  | "lost";

export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: "new_lead", label: "New Lead", color: "bg-kanban-new" },
  { key: "contacted", label: "Contacted", color: "bg-kanban-contacted" },
  { key: "requirement_collected", label: "Requirement Collected", color: "bg-kanban-requirement" },
  { key: "property_suggested", label: "Property Suggested", color: "bg-kanban-suggested" },
  { key: "visit_scheduled", label: "Visit Scheduled", color: "bg-kanban-scheduled" },
  { key: "visit_completed", label: "Visit Completed", color: "bg-kanban-completed" },
  { key: "booked", label: "Booked", color: "bg-kanban-booked" },
  { key: "lost", label: "Lost", color: "bg-kanban-lost" },
];

/* ===========================
   Stage Mapping (Frontend ↔ Backend)
=========================== */

export const STAGE_TO_BACKEND: Record<PipelineStage, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  requirement_collected: "Requirement Collected",
  property_suggested: "Property Suggested",
  visit_scheduled: "Visit Scheduled",
  visit_completed: "Visit Completed",
  booked: "Booked",
  lost: "Lost",
};

export const BACKEND_TO_STAGE: Record<string, PipelineStage> = {
  "New Lead": "new_lead",
  "Contacted": "contacted",
  "Requirement Collected": "requirement_collected",
  "Property Suggested": "property_suggested",
  "Visit Scheduled": "visit_scheduled",
  "Visit Completed": "visit_completed",
  "Booked": "booked",
  "Lost": "lost",
};



export type LeadSource = "Website" | "WhatsApp" | "Instagram" | "Phone Call" | "Google Form";

export const LEAD_SOURCES: LeadSource[] = [
  "Website",
  "WhatsApp",
  "Instagram",
  "Phone Call",
  "Google Form"
];



export const AGENTS = [
  "Rahul Sharma",
  "Priya Patel",
  "Amit Kumar",
  "Sneha Gupta"
];


export interface Visit {
  id: number;
  propertyName: string;
  date: string;
  time: string;
  outcome: string;
}

export interface Lead {
  id: number;
  name: string;
  phone: string;
  source: LeadSource;
  assignedAgent: string;
  stage: PipelineStage;
  createdAt: string;
  updatedAt: string;
  visits: Visit[];
  notes?: string;
   location?: string;
}

export interface Agent {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
}



export interface Property {
  id: number;
  name: string;
  createdAt: string;
}