import pg, { Connection } from "pg"
import dotenv from "dotenv"

dotenv.config()

const {Pool} = pg

const db = new Pool({
    connectionString : process.env.NEON_DATABASE_STRING,
    ssl: { 
    rejectUnauthorized: false 
  }
}
)

export default db

