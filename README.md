# Gharpayy 🏠

A full-stack PG (Paying Guest) lead management system built to streamline the process of tracking leads, managing agents, scheduling property visits, and converting prospects into tenants.

## 🌐 Live Demo

The application is hosted online and accessible without any local setup.

---

## 📋 Overview

Gharpayy is designed for PG operators and real estate agents to efficiently manage their sales pipeline. It provides a centralized dashboard to handle incoming leads, assign them to agents, track property visits, and monitor conversion status — all in one place.

---

## 🛠️ Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | React (Vite)            |
| Backend    | Node.js + Express       |
| Database   | PostgreSQL (raw `pg` queries) |
| Hosting    | Cloud-hosted (live)     |

---

## ✨ Features

- 📥 **Lead Management** — Capture and track incoming PG inquiries
- 👤 **Agent Assignment** — Assign leads to specific agents for follow-up
- 🏡 **Property Listings** — Manage available PG properties
- 📅 **Visit Scheduling** — Schedule and track property visits
- 📊 **Pipeline Tracking** — Monitor lead status from inquiry to conversion

---

## ⚙️ Environment Variables

To run this project locally, create a `.env` file in the backend root directory and add the following:

```env
DATABASE_URL=your_postgresql_connection_string
```

---

## 🚀 Running Locally

### Backend

```bash
cd backend
npm install
node server.js
```

The backend runs on port **5001**.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🗂️ Project Structure

```
Gharpayy/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── db.js                  # PostgreSQL connection & queries
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui component library
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   ├── LeadCaptureForm.tsx
│   │   │   ├── LeadDetailPanel.tsx
│   │   │   ├── AnalyticsBar.tsx
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AppSidebar.tsx
│   │   │   └── NavLink.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Leads.tsx
│   │   │   ├── Pipeline.tsx
│   │   │   ├── Visits.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── NotFound.tsx
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/
│   │   │   ├── types.ts       # Shared TypeScript types
│   │   │   ├── store.ts       # State management
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 👤 Author

**Md Kaif Nawaz Khurram**

---

## 📄 License

This project is intended for academic/submission purposes.