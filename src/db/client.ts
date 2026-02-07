import { Pool } from "pg";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
