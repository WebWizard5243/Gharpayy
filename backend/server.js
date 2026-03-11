import express, { response } from "express"
import dotenv from  "dotenv"
import pg from "pg"
import cors from "cors"
import db from "./db.js"


const app = express();
const PORT = 5001
app.use(cors());
app.use(express.json());

app.post("/newLeads", async (req, res) => {

  const { name, phone, source, status, createdAt, location, agentId } = req.body;

  try {

    // get all agents
    const agentCall = await db.query(`SELECT id FROM agents ORDER BY id`);

    const agents = agentCall.rows;

    if (agents.length === 0) {
      return res.status(400).json({ message: "No agents available" });
    }

    // count total leads
    const totalLeadsCall = await db.query(`SELECT COUNT(*) FROM leads`);

    const totalLeads = parseInt(totalLeadsCall.rows[0].count);

    // round robin calculation
    const agentIndex = totalLeads % agents.length;

    const assignedAgentId = agentId || agents[agentIndex].id;
    

    // insert lead
    const response = await db.query(
      `INSERT INTO leads(name, phone, source, status, assigned_agent_id, created_at, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [name, phone, source, status, assignedAgentId, createdAt, location]
    );

    res.status(201).json({
      message: "Lead Added Successfully",
      data: response.rows[0]
    });

  } catch (error) {

    console.error("error message:", error.message);

    res.status(500).json({
      message: "Something went wrong"
    });

  }

});

app.get("/leads", async(req,res) => {
    try {
        const response =  await db.query(`SELECT * FROM leads ORDER BY created_at DESC;`)
        if(response.rows){
            res.status(200).json({
                result : response.rows
            })
        } else {
            res.status(404).json({
                message : "No Leads found"
            })
        }
    } catch (error) {
        console.error("error message :",error.message)
        res.status(500).json({message : "something went wrong"})
    }
})

app.patch("/leads/:id",async(req,res)=> {
    const id = req.params.id
    const {status, agentId} = req.body
    try {
        const response = await db.query(`UPDATE leads SET status = COALESCE($1,status), assigned_agent_id =COALESCE($2,assigned_agent_id) WHERE id = $3 RETURNING * `,[status, agentId, id])
        if(response.rows){
            res.status(200).json({ message : "fields updated succesfully"})
        } else {
            res.status(400).json({ message : "lead not found"})
        }
    } catch (error) {
        console.error("error message :", error.message)
        res.status(500).json({message : "Something went wrong :)"})
    }
})

app.post("/visits", async(req,res) => {
    const {leadId, agentId,propertyName, outcome, visitTime} = req.body;
    try {
        const response = await db.query(`INSERT INTO visits(lead_id,property_name,visit_time,outcome,agent_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,[leadId, propertyName,visitTime,outcome,agentId])

        if(response.rows){
            res.status(201).json({ result : response.rows})
        } 
    } catch (error) {
        console.error("error message :",error.message)
        res.status(500).json({ message : "something went wrong "})
    }
})

app.get("/visits",async(req,res) => {
    try {
        const response = await db.query(`SELECT v.*, l.name as lead_name, l.phone as lead_phone 
            FROM visits v 
            JOIN leads l ON v.lead_id = l.id 
            ORDER BY v.visit_time DESC`)
        if(response.rows){
            res.status(200).json({result : response.rows})
        } else {
            res.status(404).json({message : "No visits found"})
        }
    } catch (error) {
        console.error("error message :",error.message)
        res.status(500).json({ message : "Something Went Wrong"})
    }
})

app.patch("/visits/:id", async (req, res) => {
  const { id } = req.params;
  const { outcome } = req.body;
  try {
    const response = await db.query(
      `UPDATE visits SET outcome = $1 WHERE id = $2 RETURNING *`,
      [outcome, id]
    );
    if (response.rows.length === 0) {
      return res.status(404).json({ message: "Visit not found" });
    }
    res.status(200).json({ message: "Outcome updated", data: response.rows[0] });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/leads/followup", async(req,res) => {
try {
    const response = await db.query(`SELECT * FROM leads WHERE status = 'New Lead' AND created_at < NOW() - INTERVAL '1 day';`)
    if(response.rows.length > 0){
        res.status(200).json({ result : response.rows})
    } else {
        res.status(404).json({message : "No leads need followup"})
    }
} catch (error) {
    console.error("errror message :", error.message)
    res.status(500).json({ message : "something went wrong"})
}
})

app.get("/dashboard", async(req,res) => {
    try {
        const response = await db.query(`SELECT status, COUNT(*) AS count FROM leads GROUP BY status;`)
        if(response.rows){
            res.status(200).json({ result : response.rows})
        } else {
            res.status(404).json({ message : "no data found try again"})
        }
    } catch (error) {
        console.error("error message :", error.message)
        res.status(500).json({ message : "something went wrong"})
    }
})

app.post("/agents", async(req,res) => {
    const { name, email} = req.body
    try {
        const response = await db.query(`INSERT INTO agents(name, email) VALUES ($1, $2) RETURNING *`,[name, email])
        if(response.rows){
            res.status(201).json({result : response.rows})
        }
    } catch (error) {
        console.error("error message :",error.message)
        res.status(500).json({ message : "something went wrong"})
    }
})

app.patch("/agents/:id/toggle", async (req, res) => {
  const { id } = req.params;

  try {

    const response = await db.query(
      `UPDATE agents
       SET active = NOT active
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (response.rows.length === 0) {
      return res.status(404).json({
        message: "Agent not found"
      });
    }

    res.status(200).json({
      message: "Agent status toggled",
      data: response.rows[0]
    });

  } catch (error) {

    console.error("error:", error.message);

    res.status(500).json({
      message: "Something went wrong"
    });

  }
});

app.get("/agents", async(req,res) => {
    try {
        const response = await db.query("SELECT * FROM agents ORDER BY id ASC")
        if(response.rows.length > 0){
            res.status(200).json({ result : response.rows})
        } else {
            res.status(404).json({message : "no agents found"})
        }
    } catch (error) {
        console.error("error message : ", error.message)
        res.status(500).json({message : "sonething went wrong"})
    }
})

app.delete("/agents/:id",async(req,res)=> {
    const {id} = req.params;
    try {
        const response = await db.query(`DELETE FROM agents WHERE id = $1 RETURNING *; `,[id])
        if(response.rows.length == 0){
           return res.status(404).json({message : "no agent found"})
        } 
        res.status(200).json({result : response.rows})
    } catch (error) {
        console.error("error message :",console.error)
        res.status(500).json({message : "something went wrong"})
    }
})

app.get("/properties", async (req, res) => {
  try {
    const response = await db.query(`SELECT * FROM properties ORDER BY created_at DESC`);
    res.status(200).json({ result: response.rows });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/properties", async (req, res) => {
  const { name } = req.body;
  try {
    const response = await db.query(
      `INSERT INTO properties(name) VALUES ($1) RETURNING *`,
      [name]
    );
    res.status(201).json({ result: response.rows });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.delete("/properties/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await db.query(
      `DELETE FROM properties WHERE id = $1 RETURNING *`,
      [id]
    );
    if (response.rows.length === 0) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.status(200).json({ message: "Property deleted", data: response.rows[0] });
  } catch (error) {
    console.error("error message:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.listen(PORT,() => {
    console.log(`this server is running on port ${PORT}`)
})