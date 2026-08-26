import express, { response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Redis } from "@upstash/redis";

dotenv.config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter,
});
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

async function cached(key, ttlseconds, queryFn) {
  const hit = await redis.get(key);

  if (hit) {
    console.log(`Cache hit for ${key}`);
    return hit;
  }

  console.log(`Cache miss for ${key}`);
  const data = await queryFn();

  await redis.set(key, JSON.stringify(data), { ex: ttlseconds });

  return data;
}

app.post("/newLeads", async (req, res) => {
  const { name, phone, source, status, createdAt, location, agentId } =
    req.body;

  try {
    // get all agents
    const agents = await prisma.agents.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });

    if (agents.length === 0) {
      return res.status(400).json({ message: "No agents available" });
    }

    // count total leads
    const totalLeads = await prisma.leads.count();

    // round robin calculation
    const agentIndex = totalLeads % agents.length;

    const assignedAgentId = agentId || agents[agentIndex].id;

    // insert lead
    const lead = await prisma.leads.create({
      data: {
        name,
        phone,
        source,
        status: status || "New Lead",
        assigned_agent_id: assignedAgentId,
        created_at: createdAt ? new Date(createdAt) : new Date(),
        location,
      },
    });
    await redis.del("leads:all", "dashboard:stats", "init:dashboard");
    res.status(201).json({
      message: "Lead Added Successfully",
      data: lead,
    });
  } catch (error) {
    console.error("error message:", error.message);

    res.status(500).json({
      message: "Something went wrong",
    });
  }
});

app.get("/leads", async (req, res) => {
  try {
    const leads = await cached("leads:all", 3600, () =>
      prisma.leads.findMany({ orderBy: { created_at: "desc" } }),
    );
    res.status(200).json({ result: leads });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.patch("/leads/:id", async (req, res) => {
  const id = req.params.id;
  const { status, agentId } = req.body;
  try {
    await prisma.leads.update({
      where: { id: parseInt(id) },
      data: {
        ...(status !== undefined && { status }),
        ...(agentId !== undefined && { assigned_agent_id: agentId }),
      },
    });
    await redis.del("leads:all", "dashboard:stats", "init:dashboard");
    res.status(200).json({ message: "fields updated succesfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(400).json({ message: "lead not found" });
    }
    console.error("error message:", error.message);
    res.status(500).json({ message: "Something went wrong :)" });
  }
});

app.post("/visits", async (req, res) => {
  const { leadId, agentId, propertyName, outcome, visitTime } = req.body;
  try {
    const visit = await prisma.visits.create({
      data: {
        lead_id: leadId,
        property_name: propertyName,
        visit_time: visitTime ? new Date(visitTime) : null,
        outcome,
        agent_id: agentId,
      },
    });
    await redis.del("visits:all");

    res.status(201).json({ result: [visit] });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "something went wrong " });
  }
});

app.get("/visits", async (req, res) => {
  try {
    const visits = await cached("visits:all", 3600, async () => {
      const raw = await prisma.visits.findMany({
        include: {
          leads: {
            select: { name: true, phone: true },
          },
        },
        orderBy: { visit_time: "desc" },
      });

      // flatten to match frontend format
      return raw.map((v) => ({
        ...v,
        lead_name: v.leads?.name ?? null,
        lead_phone: v.leads?.phone ?? null,
        leads: undefined,
      }));
    });

    res.status(200).json({ result: visits });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "Something Went Wrong" });
  }
});

app.patch("/visits/:id", async (req, res) => {
  const { id } = req.params;
  const { outcome } = req.body;
  try {
    const visit = await prisma.visits.update({
      where: { id: parseInt(id) },
      data: { outcome },
    });
    await redis.del("visits:all");
    res.status(200).json({ message: "Outcome updated", data: visit });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Visit not found" });
    }
    console.error("error message:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/leads/followup", async (req, res) => {
  try {
    const leads = await prisma.leads.findMany({
      where: {
        status: "New Lead",
        created_at: { lt: new Date(Date.now() - 86400000) },
      },
    });
    if (leads.length > 0) {
      res.status(200).json({ result: leads });
    } else {
      res.status(404).json({ message: "No leads need followup" });
    }
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    const grouped = await cached("dashboard:stats", 3600, async () => {
      const raw = await prisma.leads.groupBy({
        by: ["status"],
        _count: { status: true },
      });

      return raw.map((g) => ({
        status: g.status,
        count: g._count.status,
      }));
    });
    res.status(200).json({ result: grouped });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.post("/agents", async (req, res) => {
  const { name, email } = req.body;
  try {
    const agent = await prisma.agents.create({
      data: { name, email },
    });
    await redis.del("agents:all", "init:dashboard");
    res.status(201).json({ result: [agent] });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.patch("/agents/:id/toggle", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // first fetch current state
    const current = await prisma.agents.findUnique({ where: { id } });

    if (!current) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // then toggle
    const updated = await prisma.agents.update({
      where: { id },
      data: { active: !current.active },
    });
    await redis.del("agents:all", "init:dashboard");

    res.status(200).json({
      message: "Agent status toggled",
      data: updated,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Agent not found" });
    }
    console.error("error:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/agents", async (req, res) => {
  try {
    const agents = await cached("agents:all", 86400, () =>
      prisma.agents.findMany({ orderBy: { id: "asc" } }),
    );
    if (agents.length > 0) {
      res.status(200).json({ result: agents });
    } else {
      res.status(404).json({ message: "no agents found" });
    }
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.delete("/agents/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const agent = await prisma.agents.delete({
      where: { id },
    });
    await redis.del("agents:all", "init:dashboard");
    res.status(200).json({ result: [agent] });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "no agent found" });
    }
    console.error("error message:", error.message);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.get("/properties", async (req, res) => {
  try {
    const properties = await cached("properties:all", 86400, () =>
      prisma.properties.findMany({ orderBy: { created_at: "desc" } }),
    );
    res.status(200).json({ result: properties });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/properties", async (req, res) => {
  const { name } = req.body;
  try {
    const property = await prisma.properties.create({ data: { name } });
    await redis.del("properties:all");
    res.status(201).json({ result: [property] });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.delete("/properties/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const property = await prisma.properties.delete({
      where: { id },
    });
    await redis.del("properties:all");
    res.status(200).json({ message: "Property deleted", data: property });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Property not found" });
    }
    console.error("error message:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// ── COMBINED INIT (single call for dashboard) ────────────────────────────────

app.get("/api/init", async (req, res) => {
  try {
    const data = await cached("init:dashboard", 1800, async () => {
      // run all queries in parallel instead of one by one
      const [leads, followUpLeads, dashboardRaw, agents] = await Promise.all([
        prisma.leads.findMany({ orderBy: { created_at: "desc" } }),
        prisma.leads.findMany({
          where: {
            status: "New Lead",
            created_at: { lt: new Date(Date.now() - 86400000) },
          },
        }),
        prisma.leads.groupBy({
          by: ["status"],
          _count: { status: true },
        }),
        prisma.agents.findMany({ orderBy: { id: "asc" } }),
      ]);

      const dashboard = dashboardRaw.map((g) => ({
        status: g.status,
        count: g._count.status,
      }));

      return { leads, followUpLeads, dashboard, agents };
    });

    res.status(200).json({ result: data });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "something went wrong" });
  }
});

// app.listen(PORT, () => {
//   console.log(`this server is running on port ${PORT}`);
// });

module.exports = app;
